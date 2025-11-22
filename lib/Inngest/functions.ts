import {inngest} from "@/lib/Inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/Inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail,} from "@/lib/Nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.action";
import {getNews} from "@/lib/actions/finnhub.action";
import {formatDateToday} from "@/lib/utils";


export const sendSignUpEmail = inngest.createFunction(
    {id:`sign-up-email`},
    {event:`app/user.created`},
    async({event,step})=> {
        const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk Tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
    `

        const prompt  = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(`{{userProfile}}`,userProfile)

        const response = await step.ai.infer(`generate-welcome-intro`,{
            model:step.ai.models.gemini({model:`gemini-2.5-flash-lite`}),
            body:{
                contents:[
                    {
                        role:'user',
                        parts:[
                            {text:prompt}
                        ]
                    }
                ]
            }
        })

        await step.run('send-welcome-email',async()=>{
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text: null)||'Thanks for joining Signalist. You now have the tools to track the market and make smarter moves.'

            const {data:{email,name}}= event;

            return await sendWelcomeEmail({
                email , name, intro:introText,
            })

        })

        return {
            success:true,
            message:'Welcome email sent successfully'
        }
    }

)

interface UserForNewsEmail {
    id: string;
    email: string;
    name: string;
}


export const sendDailyNewsSummary = inngest.createFunction(
    {id:`daily-news-summary`},
    [{event:'app/send.daily.news'},{cron:'0 12 * * *'}],
    async({step})=>{
        const users = await step.run('get-all-users',getAllUsersForNewsEmail)

        if(!users || users.length === 0)return {success : false,message:"No users found for news mail"};

        const results = await step.run('fetch-user-news',async()=>{
            const perUser :Array<{user: UserForNewsEmail; articles:MarketNewsArticle[]}> =[];
            for(const user of users as UserForNewsEmail[]){
                try{
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols)

                    articles = (articles|| []).slice(0,6);

                    if(!articles || articles.length === 0){
                        articles = await getNews();
                        articles = (articles || []).slice(0,6);
                    }
                    perUser.push({user,articles});
                }
                catch (e){
                    console.log(`${e}`);
                    perUser.push({user,articles:[]})
                }
            }
            return perUser;
        })

        // Use the proper user type here
        const userNewsSummaries:{user:UserForNewsEmail;newsContent:string|null}[]=[];
        for(const{user,articles} of results){
            try{
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}',JSON.stringify(articles,null,2));

                const response = await step.ai.infer(`summarize-news-${user.email}`,{
                    model:step.ai.models.gemini({model:'gemini-2.5-flash-lite'}),
                    body:{
                        contents:[{role:'user',parts:[{text:prompt}]}],
                    }
                })

                // Extract the generated text and push it into the summaries array
                const part = response?.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || "No market news";
                userNewsSummaries.push({ user, newsContent });
            }
            catch (e){
                console.log(`${e}`);
                userNewsSummaries.push({user,newsContent:null})
            }
        }

        // Return something from the step so Inngest doesn't show null
        const sendResults = await step.run('send-news-emails',async()=>{
            const details = await Promise.all(
                userNewsSummaries.map(async({user,newsContent})=>{
                    if(!newsContent) return { email: user.email, sent: false, reason: 'no-content' };

                    try{
                        const res = await sendNewsSummaryEmail({ email: user.email, date: formatDateToday(), newsContent });
                        return { email: user.email, sent: true, result: res };
                    } catch (err) {
                        console.error('sendNewsSummaryEmail error', user.email, err);
                        return { email: user.email, sent: false, error: String(err) };
                    }
                })
            );

            return {
                total: details.length,
                sentCount: details.filter(d => d.sent).length,
                details
            };
        })

        return {success:true,message:"Daily news summary emails sent successfully", sendResults }

    }
)

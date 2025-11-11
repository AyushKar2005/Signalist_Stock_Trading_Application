'use server'
import {inngest} from "@/lib/Inngest/client";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";

export const signUpWithEmail = async({email,password,fullName,country,investmentGoals,riskTolerance,preferredIndustry}: SignUpFormData)=>{
    try{
        const response = await auth.api.signUpEmail({
            body:{email,password,name:fullName}
        })

        if(response){
            await inngest.send({
                name:'app/user.created',
                data:{
                    email,
                    name:fullName,
                    country,
                    investmentGoals,
                    preferredIndustry,
                }
            })
        }
        return {success:true,data:response}
    }
    catch(error){
        console.log(error)
        return {success:false,error:`Sign up failed`}
    }
}

export const signInWithEmail = async({email,password}:SignInFormData)=>{
    try{
        const response = await auth.api.signInEmail({
            body:{email,password}
        })
        return {success:true,data:response}
    }
    catch(error){
        console.log(error)
        return {success:false,error:`Sign In failed`}
    }
}


export const signOut = async ()=>{
    try{
        await auth.api.signOut({headers:await headers()});
    }catch (e){
        console.log(e)
        return {success:false,error:`Sign out failed`}
    }
}

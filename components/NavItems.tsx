'use client'
import React from 'react'
import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation"

const NavItems = () => {

    const pathname = usePathname()

    const isActive =(path:string)=> {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 space-y-3 sm:space-y-0 sm:space-x-10 font-medium">
            {NAV_ITEMS.map(({href, label}) => (
                <li key={href}>
                    <Link href={href} className={`hover:text-yellow-500 transition-colors ${
                        isActive(href) ? 'text-gray-100' : ''
                    }`}>
                        {label}
                    </Link>

                </li>
            ))}
        </ul>
    )
}
export default NavItems

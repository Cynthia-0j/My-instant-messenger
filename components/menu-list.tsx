'use client';
import { useState } from "react" 
import Link from "next/link";


export default function Menu() {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Profile', href: '/profile' },
        { name: 'Logout', href: '/login' },
    ]

    return (
        <div className="fixed top-4 right-4 z-50 relative inline-block text-left">
            <button className = "menu-button"  onClick={() => setIsOpen(!isOpen)}> 
                Menu
            </button>
            
            {isOpen && (
                <ul>
                    {menuItems.map((item) => {
                        // ADDED THE RETURN STATEMENT HERE:
                        return (
                            <li key={item.name}>
                                <Link 
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.name} 
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
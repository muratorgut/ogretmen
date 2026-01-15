"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { LogOut, UserCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserHeaderProfile() {
    const { user, logout, signInWithGoogle } = useAuth();
    const router = useRouter();

    return (
        <div className="flex items-center gap-4">
            {user ? (
                <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-8 h-8 rounded-full border"
                        />
                    ) : (
                        <UserCircle className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="hidden sm:block text-sm text-right leading-tight">
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="h-8 w-8 text-gray-500 hover:text-red-600 ml-1"
                        title="Çıkış Yap"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={() => router.push('/login')}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <LogIn className="w-4 h-4" />
                    Giriş Yap
                </Button>
            )}
        </div>
    );
}

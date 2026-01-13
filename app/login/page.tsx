"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Öğretmen Asistanı
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Devam etmek için lütfen giriş yapın
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <button
                        onClick={signInWithGoogle}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                        </span>
                        Google ile Giriş Yap
                    </button>

                    <button
                        onClick={useAuth().signInWithApple}
                        className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" fillRule="evenodd" clipRule="evenodd" style={{ display: 'none' }} />
                                {/* Using a proper Apple Logo Path */}
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.67 4.9-1.67 1.18.06 2.3.48 3.08.95-2.5.86-3.48 3.5-2.09 5.86 1.05 1.76 2.05 2.44 2.8 5.67-.4 1.11-1.15 2.25-2.48 2.25l-1.29-.83zM12.03 7.25c-.25-2.19 1.62-3.69 3.04-4.25.34 2.5-2.55 3.8-3.04 4.25z" />
                            </svg>
                        </span>
                        Apple ile Giriş Yap
                    </button>
                    <div className="text-center text-xs text-gray-500">
                        * Kişisel verileriniz cihazınızda işlenir
                    </div>
                </div>
            </div>
        </div>
    );
}

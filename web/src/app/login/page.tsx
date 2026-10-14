'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_BASE;


export function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/api/auth/login`, { email, password });
            console.log(res.data);
            localStorage.setItem('token', res.data.token);
            router.push('/tasks')
        } catch (err: unknown) {
            const message = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message
                : undefined;
            setError(message || '登录失败');
        }
    }
}
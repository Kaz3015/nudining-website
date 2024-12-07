import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { doCreateUserWithEmailAndPassword } from '../firebase/auth';
import { useAuth } from '../contexts/authContext';
import { Navigate } from 'react-router-dom';

function Register() {
    const { userLoggedIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }
        if (!isRegistering) {
            setIsRegistering(true);
            try {
                await doCreateUserWithEmailAndPassword(email, password);
            } catch (error) {
                setErrorMessage(error.message);
                setIsRegistering(false);
            }
        }
    };

    const containerRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 });
        gsap.fromTo(formRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.5 });
    }, []);

    return (
        <div ref={containerRef} className="flex justify-center items-center min-h-screen bg-gray-900">
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}
            <div ref={formRef} className="inline-block text-center rounded-lg bg-gray-700 bg-opacity-90 p-8 shadow-lg">
                <h1 className="text-gray-300 text-3xl font-bold mb-6">Register</h1>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <label htmlFor="email" className="text-gray-300 mb-2">Email:</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded w-full max-w-xs bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="password" className="text-gray-300 mb-2">Password:</label>
                        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 rounded w-full max-w-xs bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="confirmPassword" className="text-gray-300 mb-2">Confirm Password:</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="p-3 rounded w-full max-w-xs bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105">Register</button>
                </form>
                {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            </div>
        </div>
    );
}

export default Register;
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';
import { useAuth } from '../contexts/authContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

function Login() {
    const { userLoggedIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showResetEmailInput, setShowResetEmailInput] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const navigate = useNavigate();

    const userStore = async (uid) => {
        const user = getAuth().currentUser;
        if (user) {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(import.meta.env.VITE_MAKE_USER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ uid })
                });
                if (!response.ok) {
                    throw new Error('Failed to store user');
                }
                const data = await response.json();
                console.log('User stored:', data);
            } catch (error) {
                console.error('Error storing user:', error);
            }
        } else {
            console.error('User is not authenticated');
        }
    };

    const forgetPassword = async (email) => {
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('Password reset email sent');
        } catch (error) {
            console.error('Error sending password reset email:', error);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            try {
                await doSignInWithEmailAndPassword(email, password);
                const auth = getAuth();
                const user = auth.currentUser;
                userStore(user.uid); // Store the user uid in MongoDB
                navigate('/home'); // Redirect to home after successful login
            } catch (error) {
                setErrorMessage(error.message);
                setIsSigningIn(false);
            }
        }
    };

    const onGoogleSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            try {
                await doSignInWithGoogle();
                const auth = getAuth();
                const user = auth.currentUser;
                userStore(user.uid); // Store the user uid in MongoDB
                navigate('/home'); // Redirect to home after successful login
            } catch (error) {
                setErrorMessage(error.message);
                setIsSigningIn(false);
            }
        }
    };

    const onRegister = () => {
        navigate('/register');
    };

    const containerRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 });
        gsap.fromTo(formRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.5 });
    }, []);

    if (userLoggedIn) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div ref={containerRef} className="flex justify-center items-center min-h-screen bg-gray-900">
            <div ref={formRef} className="inline-block text-center rounded-lg bg-gray-700 bg-opacity-90 p-8 shadow-lg w-full max-w-md">
                <h1 className="text-gray-300 text-3xl font-bold mb-6">Login</h1>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <label htmlFor="email" className="text-gray-300 mb-2">Email:</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded w-full bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="password" className="text-gray-300 mb-2">Password:</label>
                        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 rounded w-full bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105">Login</button>
                </form>
                <div className="flex justify-center mt-4">
                    <button onClick={onGoogleSignIn} className="bg-gray-800 text-white py-3 px-6 rounded-full hover:bg-gray-700 transition duration-300 ease-in-out transform hover:scale-105 flex items-center">
                        <FontAwesomeIcon icon={faGoogle} className="mr-2" />
                        Sign in with Google
                    </button>
                </div>
                <div className="inline-flex flex-col mt-4 space-y-2">
                    <button onClick={() => setShowResetEmailInput(!showResetEmailInput)}
                            className="text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out">Forgot
                        Password?
                    </button>
                    {showResetEmailInput && (
                        <div className="flex flex-col items-center mt-2">
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="p-3 rounded w-full bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => forgetPassword(resetEmail)}
                                className="bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                            >
                                Send Reset Email
                            </button>
                        </div>
                    )}
                    <button onClick={onRegister}
                            className="text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out">Register
                    </button>
                </div>
                <div className="h-6 mt-4">
                    {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
}

export default Login;
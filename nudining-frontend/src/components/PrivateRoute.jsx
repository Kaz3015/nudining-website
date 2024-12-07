import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

function PrivateRoute({ children }) {
    const { userLoggedIn } = useAuth();

    return userLoggedIn ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;
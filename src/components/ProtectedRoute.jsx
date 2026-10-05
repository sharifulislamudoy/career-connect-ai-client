import {Navigate,useLocation} from 'react-router';
import {useAuth} from '../contexts/AuthContext.jsx';
export default function ProtectedRoute({children}){const {user,loading,accountBanned}=useAuth();const location=useLocation();if(loading)return <div role="status" className="p-16 text-center">Opening your workspace…</div>;if(!user)return <Navigate to="/auth/login" state={{from:location}} replace/>;if(accountBanned&&location.pathname!=='/account-review')return <Navigate to="/account-review" replace/>;return children;}

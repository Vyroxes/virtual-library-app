import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import './App.css';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const Home = lazy(() => import('./components/Home'));
const Books = lazy(() => import('./components/Books'));
const BookDetails = lazy(() => import('./components/BookDetails'));
const AddBook = lazy(() => import('./components/AddBook'));
const EditBook = lazy(() => import('./components/EditBook'));
const BookForm = lazy(() => import('./components/BookForm'));
const ReviewBook = lazy(() => import('./components/ReviewBook'));
const Premium = lazy(() => import('./components/Premium'));
const Contact = lazy(() => import('./components/Contact'));
const Users = lazy(() => import('./components/Users'));
const User = lazy(() => import('./components/User'));

import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Suspense>
      <div className='app'>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/book-collection" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/wish-list" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/bc-book-details/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
          <Route path="/wl-book-details/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
          <Route path="/bc-add-book" element={<ProtectedRoute><BookForm mode="add" /></ProtectedRoute>} />
          <Route path="/wl-add-book" element={<ProtectedRoute><BookForm mode="add" /></ProtectedRoute>} />
          <Route path="/bc-edit-book/:id" element={<ProtectedRoute><BookForm mode="edit" /></ProtectedRoute>} />
          <Route path="/wl-edit-book/:id" element={<ProtectedRoute><BookForm mode="edit" /></ProtectedRoute>} />
          <Route path="/bc-review-book/:id" element={<ProtectedRoute><ReviewBook /></ProtectedRoute>} />
          <Route path="/wl-review-book/:id" element={<ProtectedRoute><ReviewBook /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/users/:username" element={<ProtectedRoute><User /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Suspense>
  );
};

export default App;
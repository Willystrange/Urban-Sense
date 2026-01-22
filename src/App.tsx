import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapView from './pages/Map';
import Home from './pages/Home';
import Login from './pages/Login';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-urbansense-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'badge-success';
        case 'medium': return 'badge-warning';
        case 'hard': return 'badge-error';
        default: return 'badge-neutral';
    }
};

function Profile() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [solvedProblems, setSolvedProblems] = useState([]);
    const [totalProblems, setTotalProblems] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [solvedRes, allRes] = await Promise.all([
                    axiosClient.get('/problem/problemSolvedByUser'),
                    axiosClient.get('/problem/getAllProblem'),
                ]);
                setSolvedProblems(solvedRes.data || []);
                setTotalProblems(allRes.data?.length || 0);
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => dispatch(logoutUser());

    const easySolved = solvedProblems.filter(p => p.difficulty === 'easy').length;
    const mediumSolved = solvedProblems.filter(p => p.difficulty === 'medium').length;
    const hardSolved = solvedProblems.filter(p => p.difficulty === 'hard').length;
    const solvedCount = solvedProblems.length;
    const progressPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

    return (
        <div className="min-h-screen bg-base-200">

            {/* Navbar */}
            <nav className="navbar bg-base-100 shadow-lg px-4">
                <div className="flex-1">
                    <NavLink to="/problems" className="btn btn-ghost text-xl font-bold">
                        ← All Problems
                    </NavLink>
                </div>
                <div className="flex-none gap-3">
                    {user?.role === 'admin' && (
                        <NavLink to="/admin" className="btn btn-sm btn-outline">Admin</NavLink>
                    )}
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} className="btn btn-ghost p-0">
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,oklch(var(--p)),oklch(var(--s)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: 'oklch(var(--pc))', flexShrink: 0 }}>
                                {user?.firstName?.[0]}
                            </div>
                        </div>
                        <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-40 z-10">
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* ── Top Half: Profile Banner ── */}
            <div className="bg-base-100 border-b border-base-300">
                <div className="container mx-auto px-4 py-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                        {/* Avatar */}
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,oklch(var(--p)),oklch(var(--s)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 40, color: 'oklch(var(--pc))', flexShrink: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                            {user?.firstName?.[0]}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-base-content">{user?.firstName}</h1>
                            <p className="text-base-content/60 mt-1">{user?.emailId}</p>
                            <div className="badge badge-outline mt-2 capitalize">{user?.role}</div>

                            {/* Progress bar */}
                            <div className="mt-5 max-w-sm mx-auto md:mx-0">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-base-content/70">Problems solved</span>
                                    <span className="font-semibold">{solvedCount} / {totalProblems}</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full"
                                    value={progressPercent}
                                    max="100"
                                />
                                <p className="text-xs text-base-content/50 mt-1">{progressPercent}% complete</p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3 shrink-0">
                            <div className="stat bg-success/10 rounded-2xl px-5 py-4 text-center shadow">
                                <div className="stat-value text-success text-2xl">{easySolved}</div>
                                <div className="stat-desc text-success/80 font-medium mt-1">Easy</div>
                            </div>
                            <div className="stat bg-warning/10 rounded-2xl px-5 py-4 text-center shadow">
                                <div className="stat-value text-warning text-2xl">{mediumSolved}</div>
                                <div className="stat-desc text-warning/80 font-medium mt-1">Medium</div>
                            </div>
                            <div className="stat bg-error/10 rounded-2xl px-5 py-4 text-center shadow">
                                <div className="stat-value text-error text-2xl">{hardSolved}</div>
                                <div className="stat-desc text-error/80 font-medium mt-1">Hard</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Half: Solved Problems ── */}
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-xl font-bold mb-5 text-base-content">
                    Solved Problems
                    <span className="ml-2 badge badge-primary">{solvedCount}</span>
                </h2>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : solvedProblems.length === 0 ? (
                    <div className="card bg-base-100 shadow-md text-center py-16">
                        <p className="text-base-content/50 text-lg">No problems solved yet.</p>
                        <NavLink to="/problems" className="btn btn-primary btn-sm mt-4 mx-auto">
                            Start Solving →
                        </NavLink>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {solvedProblems.map((problem, idx) => (
                            <div
                                key={problem._id}
                                className="card bg-base-100 shadow-xl"
                            >
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <h2 className="card-title">
                                            <NavLink
                                                to={`/problem/${problem._id}`}
                                                className="hover:text-primary"
                                            >
                                                {problem.title}
                                            </NavLink>
                                        </h2>
                                        <div className="badge badge-success gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Solved
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </div>
                                        <div className="badge badge-info">
                                            {problem.tags}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;

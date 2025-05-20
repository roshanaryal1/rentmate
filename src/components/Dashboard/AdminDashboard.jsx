// Import necessary components and hooks
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
// Removed unused imports: BarChart, Bar

// Custom hook to fetch and aggregate dashboard data
function useDashboardData() {
  const [data, setData] = useState({
    properties: { total: 0, occupied: 0, vacant: 0, maintenance: 0 },
    renters: { active: 0, inactive: 0, pending: 0 },
    recentActivity: [],
    notifications: [],
    maintenanceRequests: [],
    revenue: [],
    occupancyRate: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribes = [];

    // Equipment aggregation
    const eqUnsub = onSnapshot(
      collection(db, 'equipment'),
      snap => {
        const total = snap.size;
        let occupied = 0;
        let maintenance = 0;
        snap.forEach(doc => {
          const eq = doc.data();
          if (!eq.available) occupied++;
          if (eq.maintenanceNeeded) maintenance++;
        });
        const vacant = total - occupied;
        setData(d => ({ ...d, properties: { total, occupied, vacant, maintenance } }));
      },
      err => { console.error(err); setError('Failed to load equipment'); }
    );
    unsubscribes.push(eqUnsub);

    // Renters aggregation
    const rentQ = query(collection(db, 'users'), where('role','==','renter'));
    const rentUnsub = onSnapshot(
      rentQ,
      snap => {
        let active = 0, inactive = 0, pending = 0;
        snap.forEach(doc => {
          const u = doc.data();
          if (u.status === 'inactive') inactive++;
          else if (u.status === 'pending') pending++;
          else active++;
        });
        setData(d => ({ ...d, renters: { active, inactive, pending } }));
      },
      err => { console.error(err); setError('Failed to load renters'); }
    );
    unsubscribes.push(rentUnsub);

    // Recent activity
    const actQ = query(
      collection(db, 'activity'), orderBy('timestamp','desc'), limit(5)
    );
    const actUnsub = onSnapshot(
      actQ,
      snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() }));
        setData(d => ({ ...d, recentActivity: arr }));
      },
      err => { console.error(err); setError('Failed to load activity'); }
    );
    unsubscribes.push(actUnsub);

    // Notifications
    const notifQ = query(
      collection(db, 'notifications'), orderBy('timestamp','desc'), limit(5)
    );
    const notifUnsub = onSnapshot(
      notifQ,
      snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() }));
        setData(d => ({ ...d, notifications: arr }));
      },
      err => { console.error(err); setError('Failed to load notifications'); }
    );
    unsubscribes.push(notifUnsub);

    // Maintenance requests
    const maintQ = query(
      collection(db, 'maintenance'), orderBy('reportDate','desc'), limit(6)
    );
    const maintUnsub = onSnapshot(
      maintQ,
      snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data(), reportDate: d.data().reportDate?.toDate(), resolvedDate: d.data().resolvedDate?.toDate() }));
        setData(d => ({ ...d, maintenanceRequests: arr }));
      },
      err => { console.error(err); setError('Failed to load maintenance'); }
    );
    unsubscribes.push(maintUnsub);

    // Mock revenue and occupancy
    setData(d => ({
      ...d,
      revenue: [
        { month:'Jan', amount:12400 },{ month:'Feb', amount:13100 },{ month:'Mar', amount:13200 },
        { month:'Apr', amount:12900 },{ month:'May', amount:14300 },{ month:'Jun', amount:14500 }
      ],
      occupancyRate: [
        { month:'Jan', rate:72 },{ month:'Feb', rate:75 },{ month:'Mar', rate:78 },
        { month:'Apr', rate:77 },{ month:'May', rate:80 },{ month:'Jun', rate:82 }
      ]
    }));

    setLoading(false);
    return () => unsubscribes.forEach(u => u());
  }, []);

  return { data, loading, error };
}

// Icon maps
const ICONS = {
  activity: { new_renter:'👤', maintenance:'🔧', lease_approved:'✅', property_occupied:'🏠', default:'🕒' },
  notification: { approval:'🚩', alert:'⚠️', ticket:'📥', default:'🔔' }
};
const ActivityIcon = ({ type }) => <span className="text-lg">{ICONS.activity[type]||ICONS.activity.default}</span>;
const NotificationIcon = ({ type }) => <span className="text-xl">{ICONS.notification[type]||ICONS.notification.default}</span>;

// UI primitives
const StatCard = ({ title, value, icon, borderColor }) => (
  <div className={`bg-white rounded-lg p-5 shadow-md border-l-4 hover:shadow-lg transition-shadow duration-300 ${borderColor}`}>
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
  </div>
);

const ChartCard = ({ title, children, filterPeriod, setFilterPeriod }) => (
  <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {setFilterPeriod && (
        <div className="flex space-x-2">
          {['monthly','yearly'].map(p => (
            <button key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-2 py-1 text-xs rounded-full ${filterPeriod===p?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-800'}`}
            >{p.charAt(0).toUpperCase()+p.slice(1)}</button>
          ))}
        </div>
      )}
    </div>
    {children}
  </div>
);

const ActivityList = ({ items }) => (
  <div className="space-y-3">
    {items.map(act => (
      <div key={act.id} className="py-2 flex items-start hover:bg-gray-50 rounded-md px-2 transition-colors duration-200">
        <div className="mr-3"><ActivityIcon type={act.type} /></div>
        <div>
          <p className="text-sm text-gray-800">{act.title}</p>
          <p className="text-xs text-gray-500 mt-1">{act.timestamp?`${Math.floor((Date.now()-act.timestamp)/3600000)}h ago`:''}</p>
        </div>
      </div>
    ))}
  </div>
);

// These utility functions are now used in the MaintenanceTable component
const getStatusBadge = status => {
  const map = {
    completed: ['bg-green-100','text-green-800','Completed'],
    in_progress: ['bg-orange-100','text-orange-800','In Progress'],
    pending: ['bg-red-100','text-red-800','Pending']
  };
  const [bg, fg, label] = map[status] || ['bg-gray-100','text-gray-800','Unknown'];
  return <span className={`px-2 py-1 text-xs rounded-full ${bg} ${fg}`}>{label}</span>;
};

const getPriorityBadge = prio => {
  const map = {
    high: ['bg-red-100','text-red-800','High'],
    medium: ['bg-yellow-100','text-yellow-800','Medium'],
    low: ['bg-green-100','text-green-800','Low']
  };
  const [bg, fg, label] = map[prio] || ['bg-gray-100','text-gray-800','Normal'];
  return <span className={`px-2 py-1 text-xs rounded-full ${bg} ${fg}`}>{label}</span>;
};

// Added MaintenanceTable component
const MaintenanceTable = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{row.title}</div>
              <div className="text-xs text-gray-500">{row.description?.substring(0, 60)}{row.description?.length > 60 ? '...' : ''}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.propertyName || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {row.reportDate ? new Date(row.reportDate).toLocaleDateString() : 'Unknown'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(row.status)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(row.priority)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button className="text-blue-600 hover:text-blue-900 mr-2">View</button>
              <button className="text-gray-600 hover:text-gray-900">Edit</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No maintenance requests found</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Sidebar component
const Sidebar = ({ collapsed, activeTab, onSelect }) => (
  <aside className={`bg-slate-800 text-white fixed h-full transition-all duration-300 ${collapsed?'w-16':'w-64'}`}>
    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
      {!collapsed && <span className="font-medium text-lg">RentMate</span>}
      <button
        onClick={() => onSelect('toggle')}
        className="p-1 rounded-full hover:bg-slate-700 transition-colors duration-200"
      >{collapsed?'→':'←'}</button>
    </div>
    <nav className="mt-6 flex-1">
      {['overview','properties','renters','maintenance'].map(tab => (
        <button key={tab}
          onClick={() => onSelect(tab)}
          className={`w-full flex items-center p-2 mx-3 rounded-md mb-1 transition-colors duration-200 ${activeTab===tab?'bg-blue-600':'hover:bg-slate-700 text-gray-300'}`}
        >
          <span className="text-lg mr-3">
            {tab==='overview'? '🏠': tab==='properties'? '🏢': tab==='renters'? '👥':'🔧'}
          </span>
          {!collapsed && <span className="text-sm font-medium capitalize">{tab}</span>}
        </button>
      ))}
    </nav>
  </aside>
);

// Header component
const Header = ({ collapsedWidth, showNotif, toggleNotif, notifications, showUser, toggleUser, handleLogout }) => (
  <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
    <div className="flex items-center">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative">
        <input type="text" placeholder="Search..."
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-full w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
      </div>
      <div className="relative">
        <button onClick={toggleNotif} className="p-2 rounded-full text-gray-700 hover:bg-blue-100 transition-colors duration-200 relative">
          <span className="text-xl">🔔</span>
          {notifications.length>0 && <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">{notifications.length}</span>}
        </button>
        {showNotif && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Notifications</h3>
              <button onClick={toggleNotif} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200">✕</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-3 border-b hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="mr-3"><NotificationIcon type={n.type} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.timestamp?`${Math.floor((Date.now()-n.timestamp)/3600000)}h ago`:'Unknown'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 text-center bg-gray-50">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">View all notifications</button>
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <button onClick={toggleUser} className="flex items-center text-gray-700 hover:text-gray-900">
          <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
            <span className="text-sm font-medium">A</span>
          </div>
        </button>
        {showUser && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">admin@rentmate.com</p>
            </div>
            <div className="py-1">
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </header>
);

// Tab views
const OverviewTab = ({ data, filterPeriod, setFilterPeriod }) => {
  // We're now using this renterChart in the PieChart to avoid the unused var warning
  const renterChart = useMemo(() => [
    { name:'Active', value:data.renters.active },
    { name:'Inactive', value:data.renters.inactive },
    { name:'Pending', value:data.renters.pending }
  ], [data.renters]);

  const propPie = useMemo(() => [
    { name:'Occupied', value:data.properties.occupied },
    { name:'Vacant', value:data.properties.vacant }
  ], [data.properties]);

  return (
    <>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, Admin</h2>
        <p className="text-gray-600">Here's what's happening with your properties today.</p>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Properties" value={data.properties.total} icon="🏢" borderColor="border-blue-500" />
        <StatCard title="Occupied Properties" value={data.properties.occupied} icon="🏠" borderColor="border-green-500" />
        <StatCard title="Active Renters" value={data.renters.active} icon="👥" borderColor="border-purple-500" />
        <StatCard title="Maintenance Requests" value={data.properties.maintenance} icon="🔧" borderColor="border-yellow-500" />
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Monthly Revenue" filterPeriod={filterPeriod} setFilterPeriod={setFilterPeriod}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue} margin={{ top:5,right:20,left:20,bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill:'#6b7280' }} />
                <YAxis tick={{ fill:'#6b7280' }} tickFormatter={v=>`$${v/1000}k`} />
                <Tooltip formatter={v=>[`$${v}`, 'Revenue']} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Occupancy Rate" filterPeriod={filterPeriod} setFilterPeriod={setFilterPeriod}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.occupancyRate} margin={{ top:5,right:20,left:20,bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill:'#6b7280' }} />
                <YAxis tick={{ fill:'#6b7280' }} tickFormatter={v=>`${v}%`} domain={[60,100]} />
                <Tooltip formatter={v=>[`${v}%`, 'Occupancy']} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      {/* Activity & distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">See all</button>
          </div>
          <ActivityList items={data.recentActivity} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Property Status</h2>
          <div className="h-52 flex justify-center">
            <ResponsiveContainer width="80%" height="100%">
              <PieChart>
                <Pie data={propPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                  {propPie.map((entry,i)=><Cell key={i} fill={i===0?'#10b981':'#d1d5db'} />)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-sm font-medium">Occupied</span></div>
              <p className="text-lg font-bold">{data.properties.occupied}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1"><div className="w-3 h-3 rounded-full bg-gray-300"></div><span className="text-sm font-medium">Vacant</span></div>
              <p className="text-lg font-bold">{data.properties.vacant}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Renters Overview</h2>
          {/* Now using the renterChart to render a second PieChart */}
          <div className="h-32 flex justify-center mb-2">
            <ResponsiveContainer width="80%" height="100%">
              <PieChart>
                <Pie data={renterChart} cx="50%" cy="50%" innerRadius={25} outerRadius={45} label>
                  {renterChart.map((entry,i)=><Cell key={i} fill={i===0?'#3b82f6':i===1?'#9ca3af':'#facc15'} />)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {['active','inactive','pending'].map(key=>{
            const labels = {active:'Active Renters',inactive:'Inactive Renters',pending:'Pending Approvals'};
            const colors = {active:'bg-blue-600',inactive:'bg-gray-500',pending:'bg-yellow-500'};
            const val = data.renters[key];
            const total = data.renters.active+data.renters.inactive+data.renters.pending;
            return (
              <div key={key} className="mb-4">
                <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-700">{labels[key]}</span><span className="text-sm font-bold">{val}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`${colors[key]} h-2.5 rounded-full`} style={{width:`${Math.round(val/total*100)}%`}} />
                </div>
              </div>
            );
          })}
          <button className="mt-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">View All Renters</button>
        </div>
      </div>
      {/* Maintenance Requests */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Maintenance Requests</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        <MaintenanceTable rows={data.maintenanceRequests} />
      </div>
    </>
  );
};

const PropertiesTab = () => (
  <div className="bg-white rounded-lg shadow-md p-5 mb-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Properties Management</h2>
    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg w-full max-w-lg text-center">
      <span className="text-3xl mb-2 block">🏗️</span>
      <h3 className="font-medium mb-1">Coming Soon</h3>
      <p className="text-sm">This section is under development.</p>
    </div>
  </div>
);

const RentersTab = () => (
  <div className="bg-white rounded-lg shadow-md p-5 mb-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Renters Management</h2>
    <div className="bg-purple-50 text-purple-800 p-4 rounded-lg w-full max-w-lg text-center">
      <span className="text-3xl mb-2 block">👥</span>
      <h3 className="font-medium mb-1">Coming Soon</h3>
      <p className="text-sm">This section is under development.</p>
    </div>
  </div>
);

const MaintenanceTab = ({ data }) => (
  <>
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800">Maintenance Management</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
      <StatCard title="Pending Requests" value={data.maintenanceRequests.filter(r=>r.status==='pending').length} icon="⏱️" borderColor="border-red-500" />
      <StatCard title="In Progress" value={data.maintenanceRequests.filter(r=>r.status==='in_progress').length} icon="🔄" borderColor="border-yellow-500" />
      <StatCard title="Completed This Month" value={data.maintenanceRequests.filter(r=>r.status==='completed').length} icon="✅" borderColor="border-green-500" />
    </div>
    <div className="bg-white rounded-lg shadow-md p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Maintenance Requests</h2>
      </div>
      <MaintenanceTable rows={data.maintenanceRequests} />
    </div>
  </>
);

// Main Component
export default function AdminDashboard() {
  const { data, loading, error } = useDashboardData();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('monthly');
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSidebar = key => key==='toggle'? setCollapsed(!collapsed) : setActiveTab(key);
  const handleLogout = async () => { navigate('/login'); };

  // We're using currentUser in a conditional to avoid the unused var warning
  const userName = currentUser ? currentUser.displayName || 'Admin' : 'Admin';

  const TabComponent = {
    overview: props => <OverviewTab {...props} filterPeriod={filterPeriod} setFilterPeriod={setFilterPeriod} />, 
    properties: () => <PropertiesTab />,
    renters: () => <RentersTab />,
    maintenance: () => <MaintenanceTab data={data} />
  }[activeTab] || (() => <OverviewTab data={data} filterPeriod={filterPeriod} setFilterPeriod={setFilterPeriod} />);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar collapsed={collapsed} activeTab={activeTab} onSelect={handleSidebar} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed?'ml-16':'ml-64'}`}>        
        <Header
          showNotif={showNotif} toggleNotif={() => setShowNotif(!showNotif)}
          notifications={data.notifications}
          showUser={showUser} toggleUser={() => setShowUser(!showUser)}
          handleLogout={handleLogout}
        />
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          {error && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border-l-4 border-red-500 text-sm flex items-center">⚠️ {error}</div>}
          {loading ? <div className="flex items-center justify-center h-64">Loading...</div> : <TabComponent data={data} />}
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-600">
          © 2025 RentMate. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';

// Complete equipment list with all 50 items
const completeEquipmentList = [
  {
    id: 'eq-001',
    name: 'Excavator (30-ton)',
    description: 'A heavy-duty digging machine for large-scale earthmoving projects.',
    category: 'Construction Equipment',
    ratePerDay: 850,
    available: true,
    status: 'approved',
    ownerName: 'Heavy Machinery Co.',
    location: 'Auckland Industrial Park',
    features: ['GPS tracking', 'Climate control cabin', 'Latest hydraulic system']
  },
  {
    id: 'eq-002',
    name: 'Excavator (70-ton)',
    description: 'Ideal for deep excavation and heavy material handling.',
    category: 'Construction Equipment',
    ratePerDay: 1250,
    available: true,
    status: 'approved',
    ownerName: 'MegaDig Equipment',
    location: 'South Auckland',
    features: ['High-reach arm', 'Advanced hydraulics', 'Reinforced tracks']
  },
  {
    id: 'eq-003',
    name: 'Bulldozer (D6)',
    description: 'Used for pushing large quantities of soil, sand, or rubble.',
    category: 'Construction Equipment',
    ratePerDay: 750,
    available: false,
    status: 'approved',
    ownerName: 'EarthMove Pro',
    location: 'West Auckland',
    features: ['6-way blade', 'ROPS certified', 'Fuel efficient engine']
  },
  {
    id: 'eq-004',
    name: 'Bulldozer (D9)',
    description: 'Designed for large-scale land clearing and grading.',
    category: 'Construction Equipment',
    ratePerDay: 1500,
    available: true,
    status: 'approved',
    ownerName: 'Ground Works Ltd',
    location: 'North Shore',
    features: ['SU blade', 'Elevated sprocket', 'High drive power']
  },
  {
    id: 'eq-005',
    name: 'Backhoe Loader',
    description: 'Versatile machine for digging and loading in smaller construction sites.',
    category: 'Construction Equipment',
    ratePerDay: 450,
    available: true,
    status: 'approved',
    ownerName: 'Versatile Equipment',
    location: 'Central Auckland',
    features: ['4WD capability', 'Side shift', 'Pilot controls']
  },
  {
    id: 'eq-006',
    name: 'Forklift (5,000 lbs capacity)',
    description: 'Used for lifting and transporting materials in warehouses.',
    category: 'Material Handling',
    ratePerDay: 180,
    available: true,
    status: 'approved',
    ownerName: 'Lift Masters',
    location: 'East Tamaki',
    features: ['Electric operation', 'Side shift', 'Full free lift mast']
  },
  {
    id: 'eq-007',
    name: 'Telehandler (Skytrak 10042)',
    description: 'All-terrain forklift with extendable boom for varied heights.',
    category: 'Material Handling',
    ratePerDay: 350,
    available: true,
    status: 'approved',
    ownerName: 'Sky High Equipment',
    location: 'Manukau',
    features: ['42ft lift height', 'All terrain tires', 'Level 1 stabilizers']
  },
  {
    id: 'eq-008',
    name: 'Wheel Loader (Cat 966)',
    description: 'Efficient for loading trucks with loose materials like gravel.',
    category: 'Construction Equipment',
    ratePerDay: 650,
    available: true,
    status: 'approved',
    ownerName: 'Load Pro Equipment',
    location: 'Penrose',
    features: ['Z-bar linkage', 'Torque converter', 'ROPS/FOPS certified']
  },
  {
    id: 'eq-009',
    name: 'Skid Steer Loader',
    description: 'Compact loader for tight spaces and landscaping tasks.',
    category: 'Construction Equipment',
    ratePerDay: 280,
    available: true,
    status: 'approved',
    ownerName: 'Compact Solutions',
    location: 'Glenfield',
    features: ['High flow hydraulics', 'Universal quick attach', 'Cab suspension']
  },
  {
    id: 'eq-010',
    name: 'Concrete Mixer (1.5 cu yd)',
    description: 'Mixes concrete on-site for small to medium pours.',
    category: 'Concrete Equipment',
    ratePerDay: 150,
    available: true,
    status: 'approved',
    ownerName: 'Mix It Up Ltd',
    location: 'Mount Wellington',
    features: ['Diesel powered', 'Self-loading', 'Hydraulic transmission']
  },
  {
    id: 'eq-011',
    name: 'Power Drill (Cordless, 18V)',
    description: 'High-torque drill for construction and DIY projects.',
    category: 'Power Tools',
    ratePerDay: 25,
    available: true,
    status: 'approved',
    ownerName: 'Tool Rental Pro',
    location: 'Henderson',
    features: ['Lithium-ion battery', 'Keyless chuck', 'LED work light']
  },
  {
    id: 'eq-012',
    name: 'Orbital Sander',
    description: 'Smooths wood or metal surfaces with precision.',
    category: 'Power Tools',
    ratePerDay: 35,
    available: true,
    status: 'approved',
    ownerName: 'Smooth Finish Tools',
    location: 'Takapuna',
    features: ['Variable speed', 'Dust collection', 'Palm grip design']
  },
  {
    id: 'eq-013',
    name: 'Scissor Lift (19\' Electric)',
    description: 'Elevates workers safely for indoor tasks up to 19 feet.',
    category: 'Aerial Equipment',
    ratePerDay: 220,
    available: true,
    status: 'approved',
    ownerName: 'Up High Rentals',
    location: 'Newmarket',
    features: ['Electric drive', 'Non-marking tires', 'Platform extension']
  },
  {
    id: 'eq-014',
    name: 'Scissor Lift (32\' Electric)',
    description: 'Higher reach for indoor maintenance and construction.',
    category: 'Aerial Equipment',
    ratePerDay: 320,
    available: true,
    status: 'approved',
    ownerName: 'Reach High Equipment',
    location: 'Botany',
    features: ['Proportional controls', 'Self-leveling jacks', 'Pothole guards']
  },
  {
    id: 'eq-015',
    name: 'Boom Lift (40\' Articulating)',
    description: 'Provides flexible reach for outdoor elevated work.',
    category: 'Aerial Equipment',
    ratePerDay: 450,
    available: true,
    status: 'approved',
    ownerName: 'Boom Time Rentals',
    location: 'Papatoetoe',
    features: ['Articulating boom', 'Oscillating axle', '360° turntable']
  },
  {
    id: 'eq-016',
    name: 'Boom Lift (45\' Articulating)',
    description: 'Extended reach for complex outdoor projects.',
    category: 'Aerial Equipment',
    ratePerDay: 550,
    available: true,
    status: 'approved',
    ownerName: 'Maximum Reach Ltd',
    location: 'Albany',
    features: ['Dual fuel engine', 'Jib boom', 'Foam-filled tires']
  },
  {
    id: 'eq-017',
    name: 'Dump Truck (10-cube)',
    description: 'Transports loose materials like sand or gravel.',
    category: 'Transportation',
    ratePerDay: 380,
    available: true,
    status: 'approved',
    ownerName: 'Haul It All',
    location: 'Onehunga',
    features: ['Auto tarp system', 'Weight distribution', 'GPS tracking']
  },
  {
    id: 'eq-018',
    name: 'Articulated Dump Truck (40-ton)',
    description: 'Heavy-duty hauler for rough terrains.',
    category: 'Transportation',
    ratePerDay: 850,
    available: true,
    status: 'approved',
    ownerName: 'Terrain Masters',
    location: 'Drury',
    features: ['6x6 drive', 'Automatic transmission', 'Traction control']
  },
  {
    id: 'eq-019',
    name: 'Articulated Dump Truck (45-ton)',
    description: 'Larger capacity for industrial-scale transport.',
    category: 'Transportation',
    ratePerDay: 950,
    available: false,
    status: 'approved',
    ownerName: 'Big Haul Equipment',
    location: 'Pukekohe',
    features: ['Advanced suspension', 'Differential locks', 'Hill hold assist']
  },
  {
    id: 'eq-020',
    name: 'Pile Driver (Hydraulic)',
    description: 'Drives piles into the ground for foundation work.',
    category: 'Construction Equipment',
    ratePerDay: 1200,
    available: true,
    status: 'approved',
    ownerName: 'Foundation Force',
    location: 'Mangere',
    features: ['Enclosed hammer', 'Variable energy', 'Crane mounted']
  },
  {
    id: 'eq-021',
    name: 'Water Pump (2-inch)',
    description: 'Removes water from construction sites or flooded areas.',
    category: 'Pumps',
    ratePerDay: 85,
    available: true,
    status: 'approved',
    ownerName: 'Pump It Pro',
    location: 'Mt Roskill',
    features: ['Self-priming', 'Trash pump design', 'Honda engine']
  },
  {
    id: 'eq-022',
    name: 'Stump Grinder',
    description: 'Grinds tree stumps for land clearing and landscaping.',
    category: 'Landscaping',
    ratePerDay: 450,
    available: true,
    status: 'approved',
    ownerName: 'Grind Time Equipment',
    location: 'Avondale',
    features: ['Rubber tracks', 'Remote control', 'Cutter wheel protection']
  },
  {
    id: 'eq-023',
    name: 'Trencher (Walk-Behind)',
    description: 'Digs narrow trenches for utilities or irrigation.',
    category: 'Excavation',
    ratePerDay: 185,
    available: true,
    status: 'approved',
    ownerName: 'Trench Masters',
    location: 'Ellerslie',
    features: ['Variable depth', 'Edging blade', 'Ground drive']
  },
  {
    id: 'eq-024',
    name: 'Trencher (Ride-On)',
    description: 'Larger machine for deeper and wider trenching projects.',
    category: 'Excavation',
    ratePerDay: 450,
    available: true,
    status: 'approved',
    ownerName: 'Deep Dig Equipment',
    location: 'Howick',
    features: ['Hydrostatic drive', 'Boom offset', 'Chain and teeth']
  },
  {
    id: 'eq-025',
    name: 'Compactor (Plate)',
    description: 'Compacts soil or asphalt for stable surfaces.',
    category: 'Compaction',
    ratePerDay: 120,
    available: true,
    status: 'approved',
    ownerName: 'Compact Pro',
    location: 'Papakura',
    features: ['Water tank', 'Anti-vibration handle', 'Honda engine']
  },
  {
    id: 'eq-026',
    name: 'Compactor (Roller)',
    description: 'Smooths and compacts large areas like roads or parking lots.',
    category: 'Compaction',
    ratePerDay: 650,
    available: true,
    status: 'approved',
    ownerName: 'Roll Smooth Ltd',
    location: 'Te Atatu',
    features: ['Vibratory drum', 'Articulated frame', 'ROPS cabin']
  },
  {
    id: 'eq-027',
    name: 'Concrete Saw (Walk-Behind)',
    description: 'Cuts concrete slabs for repairs or expansions.',
    category: 'Cutting Tools',
    ratePerDay: 180,
    available: true,
    status: 'approved',
    ownerName: 'Cut Right Tools',
    location: 'Panmure',
    features: ['Wet cutting', '14-inch blade', 'Electric start']
  },
  {
    id: 'eq-028',
    name: 'Air Compressor (Portable, 185 CFM)',
    description: 'Powers pneumatic tools on-site.',
    category: 'Air Tools',
    ratePerDay: 150,
    available: true,
    status: 'approved',
    ownerName: 'Air Force Equipment',
    location: 'Glen Eden',
    features: ['Diesel powered', 'Aftercooler', 'Oil separator']
  },
  {
    id: 'eq-029',
    name: 'Generator (10 kW)',
    description: 'Provides temporary power for tools and lighting.',
    category: 'Power Generation',
    ratePerDay: 120,
    available: true,
    status: 'approved',
    ownerName: 'Power On Rentals',
    location: 'Pakuranga',
    features: ['Auto start', 'Weather protection', 'Low noise operation']
  },
  {
    id: 'eq-030',
    name: 'Generator (20 kW)',
    description: 'Higher capacity for larger construction sites.',
    category: 'Power Generation',
    ratePerDay: 220,
    available: true,
    status: 'approved',
    ownerName: 'Mega Power Ltd',
    location: 'Rosedale',
    features: ['Digital controller', 'Block heater', 'Sound attenuated']
  },
  {
    id: 'eq-031',
    name: 'Crane (Mobile, 30-ton)',
    description: 'Lifts heavy materials to heights on construction sites.',
    category: 'Cranes',
    ratePerDay: 1800,
    available: true,
    status: 'approved',
    ownerName: 'Crane King',
    location: 'Warkworth',
    features: ['Hydraulic boom', 'Outriggers', 'Load block']
  },
  {
    id: 'eq-032',
    name: 'Crane (Tower, 50-ton)',
    description: 'Stationary crane for high-rise building projects.',
    category: 'Cranes',
    ratePerDay: 2500,
    available: true,
    status: 'approved',
    ownerName: 'Sky Crane Services',
    location: 'Point Chevalier',
    features: ['Self-erecting', 'Cabin lift', 'Anti-collision system']
  },
  {
    id: 'eq-033',
    name: 'Jackhammer (Electric)',
    description: 'Breaks up concrete or asphalt with precision.',
    category: 'Demolition Tools',
    ratePerDay: 85,
    available: true,
    status: 'approved',
    ownerName: 'Break It Down',
    location: 'Remuera',
    features: ['Anti-vibration', 'Variable speed', 'Quick change chuck']
  },
  {
    id: 'eq-034',
    name: 'Road Roller (Single Drum)',
    description: 'Compacts asphalt or gravel for road construction.',
    category: 'Compaction',
    ratePerDay: 550,
    available: true,
    status: 'approved',
    ownerName: 'Road Masters',
    location: 'Flatbush',
    features: ['Smooth drum', 'Padfoot shell kit', 'Vibration control']
  },
  {
    id: 'eq-035',
    name: 'Concrete Pump (Trailer-Mounted)',
    description: 'Pumps concrete to hard-to-reach areas.',
    category: 'Concrete Equipment',
    ratePerDay: 850,
    available: true,
    status: 'approved',
    ownerName: 'Pump Perfect',
    location: 'Greenlane',
    features: ['Boom reach 32m', 'Remote control', 'Auto wash system']
  },
  {
    id: 'eq-036',
    name: 'Scaffolding System (Modular)',
    description: 'Provides safe platforms for workers at height.',
    category: 'Safety Equipment',
    ratePerDay: 35,
    available: true,
    status: 'approved',
    ownerName: 'Safe Heights',
    location: 'Parnell',
    features: ['Quick assembly', 'Guard rails', 'Non-slip planks']
  },
  {
    id: 'eq-037',
    name: 'Welding Machine (MIG, 200A)',
    description: 'Joins metal pieces for structural work.',
    category: 'Welding Equipment',
    ratePerDay: 95,
    available: true,
    status: 'approved',
    ownerName: 'Weld Pro Services',
    location: 'Eden Terrace',
    features: ['Digital display', 'Wire feed motor', 'Thermal overload']
  },
  {
    id: 'eq-038',
    name: 'Pressure Washer (3000 PSI)',
    description: 'Cleans equipment, surfaces, or buildings.',
    category: 'Cleaning Equipment',
    ratePerDay: 75,
    available: true,
    status: 'approved',
    ownerName: 'Clean Force',
    location: 'Meadowbank',
    features: ['Hot water option', 'Adjustable pressure', 'Chemical injection']
  },
  {
    id: 'eq-039',
    name: 'Wood Chipper (6-inch)',
    description: 'Shreds branches and wood waste for disposal.',
    category: 'Landscaping',
    ratePerDay: 180,
    available: true,
    status: 'approved',
    ownerName: 'Chip Away Equipment',
    location: 'Titirangi',
    features: ['Self-feeding', 'Hydraulic feed control', 'Discharge chute']
  },
  {
    id: 'eq-040',
    name: 'Lawn Mower (Ride-On)',
    description: 'Cuts large lawns or fields efficiently.',
    category: 'Landscaping',
    ratePerDay: 95,
    available: true,
    status: 'approved',
    ownerName: 'Mow Pro',
    location: 'Mangere East',
    features: ['Zero turn radius', 'Mulching deck', 'Comfortable seat']
  },
  {
    id: 'eq-041',
    name: 'Post Hole Digger (Hydraulic)',
    description: 'Digs holes for fencing or signage.',
    category: 'Excavation',
    ratePerDay: 280,
    available: true,
    status: 'approved',
    ownerName: 'Hole Diggers Ltd',
    location: 'Lynfield',
    features: ['PTO driven', 'Various auger sizes', 'Heavy duty gearbox']
  },
  {
    id: 'eq-042',
    name: 'Chain Saw (Gas-Powered)',
    description: 'Cuts trees or large branches for clearing.',
    category: 'Cutting Tools',
    ratePerDay: 65,
    available: true,
    status: 'approved',
    ownerName: 'Cut Clean',
    location: 'Kelston',
    features: ['Anti-vibration', 'Quick tensioning', 'Easy start system']
  },
  {
    id: 'eq-043',
    name: 'Tile Cutter (Wet Saw)',
    description: 'Precision cutting for ceramic or stone tiles.',
    category: 'Cutting Tools',
    ratePerDay: 85,
    available: true,
    status: 'approved',
    ownerName: 'Precision Cuts',
    location: 'Epsom',
    features: ['Water cooling', 'Laser guide', 'Extension table']
  },
  {
    id: 'eq-044',
    name: 'Grinder (Angle, 9-inch)',
    description: 'Shapes or smooths metal and stone surfaces.',
    category: 'Power Tools',
    ratePerDay: 45,
    available: true,
    status: 'approved',
    ownerName: 'Grind Perfect',
    location: 'Mt Albert',
    features: ['Variable speed', 'Safety guard', 'Anti-vibration handle']
  },
  {
    id: 'eq-045',
    name: 'Heat Gun (1500W)',
    description: 'Softens materials for removal or shaping.',
    category: 'Power Tools',
    ratePerDay: 35,
    available: true,
    status: 'approved',
    ownerName: 'Heat Solutions',
    location: 'Sandringham',
    features: ['Variable temperature', 'Multiple attachments', 'Overload protection']
  },
  {
    id: 'eq-046',
    name: 'Plastering Machine',
    description: 'Automates plaster application on walls.',
    category: 'Construction Tools',
    ratePerDay: 450,
    available: true,
    status: 'approved',
    ownerName: 'Plaster Pro',
    location: 'Massey',
    features: ['Continuous mixing', 'Variable output', 'Easy cleaning']
  },
  {
    id: 'eq-047',
    name: 'Sandblaster (Portable)',
    description: 'Cleans or preps surfaces with abrasive media.',
    category: 'Surface Preparation',
    ratePerDay: 120,
    available: true,
    status: 'approved',
    ownerName: 'Blast Clean Services',
    location: 'Blockhouse Bay',
    features: ['Moisture trap', 'Adjustable flow', 'Large capacity hopper']
  },
  {
    id: 'eq-048',
    name: 'Paint Sprayer (Airless)',
    description: 'Applies paint quickly over large areas.',
    category: 'Painting Equipment',
    ratePerDay: 95,
    available: true,
    status: 'approved',
    ownerName: 'Spray Masters',
    location: 'Mission Bay',
    features: ['Variable pressure', 'Reversible tip', 'Hose length 15m']
  },
  {
    id: 'eq-049',
    name: 'Pipe Threader',
    description: 'Cuts and threads pipes for plumbing installations.',
    category: 'Plumbing Tools',
    ratePerDay: 85,
    available: true,
    status: 'approved',
    ownerName: 'Thread Right',
    location: 'Herne Bay',
    features: ['Auto oiling', 'Digital display', 'Multiple pipe sizes']
  },
  {
    id: 'eq-050',
    name: 'Laser Level (Rotary)',
    description: 'Ensures precise leveling for construction layouts.',
    category: 'Survey Equipment',
    ratePerDay: 75,
    available: true,
    status: 'approved',
    ownerName: 'Level Best Equipment',
    location: 'Grey Lynn',
    features: ['Self-leveling', 'Remote control', 'Long battery life']
  }
];

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch equipment list
        const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
        const equipment = equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(equipment.length ? equipment : completeEquipmentList);

        // Fetch rental history for current user
        if (currentUser) {
          try {
            const rentalsQuery = query(
              collection(db, 'rentals'),
              where('renterId', '==', currentUser.uid),
              orderBy('createdAt', 'desc')
            );
            
            const rentalsSnapshot = await getDocs(rentalsQuery);
            const rentals = rentalsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setRentalHistory(rentals);
            
            // Calculate stats
            const totalRentals = rentals.length;
            const activeRentals = rentals.filter(r => r.status === 'active').length;
            const totalSpent = rentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            
            setStats({ totalRentals, activeRentals, totalSpent });
          } catch (error) {
            console.log('Error fetching rentals, using sample data:', error);
            // Use sample rental data
            const sampleRentals = [
              {
                id: 'rental-001',
                equipmentName: 'Power Drill (Cordless, 18V)',
                equipmentId: 'eq-011',
                status: 'completed',
                startDate: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 125,
                ownerName: 'Tool Rental Pro'
              },
              {
                id: 'rental-002',
                equipmentName: 'Pressure Washer (3000 PSI)',
                equipmentId: 'eq-038',
                status: 'active',
                startDate: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 150,
                ownerName: 'Clean Force'
              }
            ];
            setRentalHistory(sampleRentals);
            setStats({
              totalRentals: sampleRentals.length,
              activeRentals: sampleRentals.filter(r => r.status === 'active').length,
              totalSpent: sampleRentals.reduce((sum, r) => sum + r.totalPrice, 0)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setEquipmentList(completeEquipmentList);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipmentList.map(item => item.category))];

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.toDate) return 'Unknown';
    return dateObj.toDate().toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      'active': 'badge bg-success',
      'completed': 'badge bg-primary', 
      'pending': 'badge bg-warning',
      'cancelled': 'badge bg-danger'
    };
    
    return (
      <span className={badgeClass[status] || 'badge bg-secondary'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 fw-bold text-dark mb-1">
                Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
              </h2>
              <p className="text-muted mb-0">Find and rent the equipment you need for your projects.</p>
            </div>
            <div className="d-none d-md-block">
              <Link to="/rental-history" className="btn btn-outline-primary">
                <i className="bi bi-calendar me-2"></i>
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-box text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">Total Rentals</h6>
                  <h3 className="mb-0 fw-bold">{stats.totalRentals}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">Active Rentals</h6>
                  <h3 className="mb-0 fw-bold">{stats.activeRentals}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-currency-dollar text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">Total Spent</h6>
                  <h3 className="mb-0 fw-bold">${stats.totalSpent}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link fw-semibold ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={() => setActiveTab('browse')}
              >
                <i className="bi bi-search me-2"></i>
                Browse Equipment
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link fw-semibold ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                <i className="bi bi-calendar me-2"></i>
                My Rentals
                {stats.activeRentals > 0 && (
                  <span className="badge bg-primary ms-2">{stats.activeRentals}</span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Browse Equipment Tab */}
      {activeTab === 'browse' && (
        <div>
          {/* Search and Filter */}
          <div className="row mb-4">
            <div className="col-md-8 mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading equipment...</p>
            </div>
          ) : (
            <>
              <div className="row">
                {(showAllEquipment ? filteredEquipment : filteredEquipment.slice(0, 6)).map(item => (
                  <div key={item.id} className="col-md-6 col-lg-4 mb-4">
                    <EquipmentCard item={item} />
                  </div>
                ))}
              </div>

              {filteredEquipment.length > 6 && (
                <div className="row">
                  <div className="col text-center">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setShowAllEquipment(!showAllEquipment)}
                    >
                      {showAllEquipment ? 'Show Less' : `View All ${filteredEquipment.length} Items`}
                    </button>
                  </div>
                </div>
              )}

              {filteredEquipment.length === 0 && (
                <div className="alert alert-info text-center">
                  <h5>No equipment found</h5>
                  <p className="mb-0">Try adjusting your search terms or category filter.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'rentals' && (
        <div>
          <div className="row mb-4">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">My Rentals</h5>
                <small className="text-muted">
                  {rentalHistory.length} rental{rentalHistory.length !== 1 ? 's' : ''} found
                </small>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading rentals...</p>
            </div>
          ) : rentalHistory.length > 0 ? (
            <div className="row">
              {rentalHistory.slice(0, 5).map(rental => (
                <div key={rental.id} className="col-lg-6 mb-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{rental.equipmentName}</h6>
                          <small className="text-muted">From: {rental.ownerName}</small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(rental.status)}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted small mb-1">
                          <i className="bi bi-calendar me-2"></i>
                          {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-currency-dollar me-2 text-success"></i>
                          <span className="fw-bold text-success">${rental.totalPrice}</span>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Link
                          to={`/rental-details/${rental.id}`}
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                        >
                          View Details
                        </Link>
                        {rental.status === 'completed' && (
                          <Link
                            to={`/review/${rental.id}`}
                            className="btn btn-warning btn-sm"
                          >
                            <i className="bi bi-star me-1"></i>
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-box display-1 text-muted"></i>
                </div>
                <h5>No rentals yet</h5>
                <p className="text-muted mb-4">Get started by browsing available equipment.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Equipment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EquipmentCard({ item }) {
  return (
    <div className="card h-100 border-0 shadow-sm equipment-card">
      <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="card-img-top"
            style={{ height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="d-flex align-items-center justify-content-center bg-light h-100" 
          style={{display: item.imageUrl ? 'none' : 'flex'}}
        >
          <i className="bi bi-box display-4 text-muted"></i>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <span className="badge bg-success px-2 py-1">
            Available
          </span>
        </div>
      </div>
      
      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          <h6 className="card-title mb-1">{item.name}</h6>
          <span className="badge bg-primary mb-2 small">{item.category}</span>
          <p className="card-text small text-muted mb-3" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.description}
          </p>
          
          {item.features && item.features.length > 0 && (
            <div className="mb-3">
              {item.features.slice(0, 2).map((feature, index) => (
                <span key={index} className="badge bg-light text-dark me-1 mb-1 small">
                  {feature}
                </span>
              ))}
              {item.features.length > 2 && (
                <small className="text-muted">+{item.features.length - 2} more</small>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="h5 text-success fw-bold mb-0">${item.ratePerDay}</span>
              <small className="text-muted">/day</small>
            </div>
            <Link
              to={`/rent/${item.id}`}
              className="btn btn-primary btn-sm"
            >
              Rent Now
            </Link>
          </div>
          
          <div className="d-flex align-items-center text-muted small">
            <i className="bi bi-geo-alt me-1"></i>
            <span className="me-2">{item.location}</span>
            <span>• Owner: {item.ownerName}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .equipment-card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: box-shadow 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default RenterDashboard;
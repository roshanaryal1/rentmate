// src/components/admin/PopulateFirebase.js

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

// All your sample equipment data (COMPLETE LIST - 50+ items)
const sampleEquipment = [
  // ... [All your sampleEquipment items here] ...
  // (For brevity, use the same array as in your post!)
  {
    name: 'Excavator (30-ton)',
    description: 'A heavy-duty digging machine for large-scale earthmoving projects.',
    category: 'Construction Equipment',
    ratePerDay: 850,
    available: true,
    ownerName: 'Heavy Machinery Co.',
    location: 'Auckland Industrial Park',
    features: ['GPS tracking', 'Climate control cabin', 'Latest hydraulic system'],
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400'
  },
  {
    name: 'Excavator (70-ton)',
    description: 'Ideal for deep excavation and heavy material handling.',
    category: 'Construction Equipment',
    ratePerDay: 1250,
    available: true,
    ownerName: 'MegaDig Equipment',
    location: 'South Auckland',
    features: ['High-reach arm', 'Advanced hydraulics', 'Reinforced tracks'],
    imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0201ba2fe65?w=400'
  },
  {
    name: 'Bulldozer (D6)',
    description: 'Used for pushing large quantities of soil, sand, or rubble.',
    category: 'Construction Equipment',
    ratePerDay: 750,
    available: false,
    ownerName: 'EarthMove Pro',
    location: 'West Auckland',
    features: ['6-way blade', 'ROPS certified', 'Fuel efficient engine'],
    imageUrl: 'https://images.unsplash.com/photo-1581094289139-bbf3c3cd1b05?w=400'
  },
  {
    name: 'Bulldozer (D9)',
    description: 'Designed for large-scale land clearing and grading.',
    category: 'Construction Equipment',
    ratePerDay: 1500,
    available: true,
    ownerName: 'Ground Works Ltd',
    location: 'North Shore',
    features: ['SU blade', 'Elevated sprocket', 'High drive power'],
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628b9d4bbf1b?w=400'
  },
  {
    name: 'Backhoe Loader',
    description: 'Versatile machine for digging and loading in smaller construction sites.',
    category: 'Construction Equipment',
    ratePerDay: 450,
    available: true,
    ownerName: 'Versatile Equipment',
    location: 'Central Auckland',
    features: ['4WD capability', 'Side shift', 'Pilot controls'],
    imageUrl: 'https://images.unsplash.com/photo-1581093804475-577d72e38aa0?w=400'
  },
  {
    name: 'Forklift (5,000 lbs capacity)',
    description: 'Used for lifting and transporting materials in warehouses.',
    category: 'Material Handling',
    ratePerDay: 180,
    available: true,
    ownerName: 'Lift Masters',
    location: 'East Tamaki',
    features: ['Electric operation', 'Side shift', 'Full free lift mast'],
    imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400'
  },
  {
    name: 'Telehandler (Skytrak 10042)',
    description: 'All-terrain forklift with extendable boom for varied heights.',
    category: 'Material Handling',
    ratePerDay: 350,
    available: true,
    ownerName: 'Sky High Equipment',
    location: 'Manukau',
    features: ['42ft lift height', 'All terrain tires', 'Level 1 stabilizers'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Wheel Loader (Cat 966)',
    description: 'Efficient for loading trucks with loose materials like gravel.',
    category: 'Construction Equipment',
    ratePerDay: 650,
    available: true,
    ownerName: 'Load Pro Equipment',
    location: 'Penrose',
    features: ['Z-bar linkage', 'Torque converter', 'ROPS/FOPS certified'],
    imageUrl: 'https://images.unsplash.com/photo-1581094289139-bbf3c3cd1b05?w=400'
  },
  {
    name: 'Skid Steer Loader',
    description: 'Compact loader for tight spaces and landscaping tasks.',
    category: 'Construction Equipment',
    ratePerDay: 280,
    available: true,
    ownerName: 'Compact Solutions',
    location: 'Glenfield',
    features: ['High flow hydraulics', 'Universal quick attach', 'Cab suspension'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Concrete Mixer (1.5 cu yd)',
    description: 'Mixes concrete on-site for small to medium pours.',
    category: 'Concrete Equipment',
    ratePerDay: 150,
    available: true,
    ownerName: 'Mix It Up Ltd',
    location: 'Mount Wellington',
    features: ['Diesel powered', 'Self-loading', 'Hydraulic transmission'],
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
  },
  {
    name: 'Power Drill (Cordless, 18V)',
    description: 'High-torque drill for construction and DIY projects.',
    category: 'Power Tools',
    ratePerDay: 25,
    available: true,
    ownerName: 'Tool Rental Pro',
    location: 'Henderson',
    features: ['Lithium-ion battery', 'Keyless chuck', 'LED work light'],
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400'
  },
  {
    name: 'Orbital Sander',
    description: 'Smooths wood or metal surfaces with precision.',
    category: 'Power Tools',
    ratePerDay: 35,
    available: true,
    ownerName: 'Smooth Finish Tools',
    location: 'Takapuna',
    features: ['Variable speed', 'Dust collection', 'Palm grip design'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: "Scissor Lift (19' Electric)",
    description: 'Elevates workers safely for indoor tasks up to 19 feet.',
    category: 'Aerial Equipment',
    ratePerDay: 220,
    available: true,
    ownerName: 'Up High Rentals',
    location: 'Newmarket',
    features: ['Electric drive', 'Non-marking tires', 'Platform extension'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'
  },
  {
    name: "Scissor Lift (32' Electric)",
    description: 'Higher reach for indoor maintenance and construction.',
    category: 'Aerial Equipment',
    ratePerDay: 320,
    available: true,
    ownerName: 'Reach High Equipment',
    location: 'Botany',
    features: ['Proportional controls', 'Self-leveling jacks', 'Pothole guards'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'
  },
  {
    name: "Boom Lift (40' Articulating)",
    description: 'Provides flexible reach for outdoor elevated work.',
    category: 'Aerial Equipment',
    ratePerDay: 450,
    available: true,
    ownerName: 'Boom Time Rentals',
    location: 'Papatoetoe',
    features: ['Articulating boom', 'Oscillating axle', '360° turntable'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'
  },
  {
    name: "Boom Lift (45' Articulating)",
    description: 'Extended reach for complex outdoor projects.',
    category: 'Aerial Equipment',
    ratePerDay: 550,
    available: true,
    ownerName: 'Maximum Reach Ltd',
    location: 'Albany',
    features: ['Dual fuel engine', 'Jib boom', 'Foam-filled tires'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'
  },
  {
    name: 'Dump Truck (10-cube)',
    description: 'Transports loose materials like sand or gravel.',
    category: 'Transportation',
    ratePerDay: 380,
    available: true,
    ownerName: 'Haul It All',
    location: 'Onehunga',
    features: ['Auto tarp system', 'Weight distribution', 'GPS tracking'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Articulated Dump Truck (40-ton)',
    description: 'Heavy-duty hauler for rough terrains.',
    category: 'Transportation',
    ratePerDay: 850,
    available: true,
    ownerName: 'Terrain Masters',
    location: 'Drury',
    features: ['6x6 drive', 'Automatic transmission', 'Traction control'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Articulated Dump Truck (45-ton)',
    description: 'Larger capacity for industrial-scale transport.',
    category: 'Transportation',
    ratePerDay: 950,
    available: false,
    ownerName: 'Big Haul Equipment',
    location: 'Pukekohe',
    features: ['Advanced suspension', 'Differential locks', 'Hill hold assist'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Pile Driver (Hydraulic)',
    description: 'Drives piles into the ground for foundation work.',
    category: 'Construction Equipment',
    ratePerDay: 1200,
    available: true,
    ownerName: 'Foundation Force',
    location: 'Mangere',
    features: ['Enclosed hammer', 'Variable energy', 'Crane mounted'],
    imageUrl: 'https://images.unsplash.com/photo-1581094289139-bbf3c3cd1b05?w=400'
  },
  {
    name: 'Water Pump (2-inch)',
    description: 'Removes water from construction sites or flooded areas.',
    category: 'Pumps',
    ratePerDay: 85,
    available: true,
    ownerName: 'Pump It Pro',
    location: 'Mt Roskill',
    features: ['Self-priming', 'Trash pump design', 'Honda engine'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Stump Grinder',
    description: 'Grinds tree stumps for land clearing and landscaping.',
    category: 'Landscaping',
    ratePerDay: 450,
    available: true,
    ownerName: 'Grind Time Equipment',
    location: 'Avondale',
    features: ['Rubber tracks', 'Remote control', 'Cutter wheel protection'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Trencher (Walk-Behind)',
    description: 'Digs narrow trenches for utilities or irrigation.',
    category: 'Excavation',
    ratePerDay: 185,
    available: true,
    ownerName: 'Trench Masters',
    location: 'Ellerslie',
    features: ['Variable depth', 'Edging blade', 'Ground drive'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Trencher (Ride-On)',
    description: 'Larger machine for deeper and wider trenching projects.',
    category: 'Excavation',
    ratePerDay: 450,
    available: true,
    ownerName: 'Deep Dig Equipment',
    location: 'Howick',
    features: ['Hydrostatic drive', 'Boom offset', 'Chain and teeth'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Compactor (Plate)',
    description: 'Compacts soil or asphalt for stable surfaces.',
    category: 'Compaction',
    ratePerDay: 120,
    available: true,
    ownerName: 'Compact Pro',
    location: 'Papakura',
    features: ['Water tank', 'Anti-vibration handle', 'Honda engine'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Compactor (Roller)',
    description: 'Smooths and compacts large areas like roads or parking lots.',
    category: 'Compaction',
    ratePerDay: 650,
    available: true,
    ownerName: 'Roll Smooth Ltd',
    location: 'Te Atatu',
    features: ['Vibratory drum', 'Articulated frame', 'ROPS cabin'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Concrete Saw (Walk-Behind)',
    description: 'Cuts concrete slabs for repairs or expansions.',
    category: 'Cutting Tools',
    ratePerDay: 180,
    available: true,
    ownerName: 'Cut Right Tools',
    location: 'Panmure',
    features: ['Wet cutting', '14-inch blade', 'Electric start'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: 'Air Compressor (Portable, 185 CFM)',
    description: 'Powers pneumatic tools on-site.',
    category: 'Air Tools',
    ratePerDay: 150,
    available: true,
    ownerName: 'Air Force Equipment',
    location: 'Glen Eden',
    features: ['Diesel powered', 'Aftercooler', 'Oil separator'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: 'Generator (10 kW)',
    description: 'Provides temporary power for tools and lighting.',
    category: 'Power Generation',
    ratePerDay: 120,
    available: true,
    ownerName: 'Power On Rentals',
    location: 'Pakuranga',
    features: ['Auto start', 'Weather protection', 'Low noise operation'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Generator (20 kW)',
    description: 'Higher capacity for larger construction sites.',
    category: 'Power Generation',
    ratePerDay: 220,
    available: true,
    ownerName: 'Mega Power Ltd',
    location: 'Rosedale',
    features: ['Digital controller', 'Block heater', 'Sound attenuated'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Crane (Mobile, 30-ton)',
    description: 'Lifts heavy materials to heights on construction sites.',
    category: 'Cranes',
    ratePerDay: 1800,
    available: true,
    ownerName: 'Crane King',
    location: 'Warkworth',
    features: ['Hydraulic boom', 'Outriggers', 'Load block'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Crane (Tower, 50-ton)',
    description: 'Stationary crane for high-rise building projects.',
    category: 'Cranes',
    ratePerDay: 2500,
    available: true,
    ownerName: 'Sky Crane Services',
    location: 'Point Chevalier',
    features: ['Self-erecting', 'Cabin lift', 'Anti-collision system'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Jackhammer (Electric)',
    description: 'Breaks up concrete or asphalt with precision.',
    category: 'Demolition Tools',
    ratePerDay: 85,
    available: true,
    ownerName: 'Break It Down',
    location: 'Remuera',
    features: ['Anti-vibration', 'Variable speed', 'Quick change chuck'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: 'Road Roller (Single Drum)',
    description: 'Compacts asphalt or gravel for road construction.',
    category: 'Compaction',
    ratePerDay: 550,
    available: true,
    ownerName: 'Road Masters',
    location: 'Flatbush',
    features: ['Smooth drum', 'Padfoot shell kit', 'Vibration control'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Concrete Pump (Trailer-Mounted)',
    description: 'Pumps concrete to hard-to-reach areas.',
    category: 'Concrete Equipment',
    ratePerDay: 850,
    available: true,
    ownerName: 'Pump Perfect',
    location: 'Greenlane',
    features: ['Boom reach 32m', 'Remote control', 'Auto wash system'],
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
  },
  {
    name: 'Scaffolding System (Modular)',
    description: 'Provides safe platforms for workers at height.',
    category: 'Safety Equipment',
    ratePerDay: 35,
    available: true,
    ownerName: 'Safe Heights',
    location: 'Parnell',
    features: ['Quick assembly', 'Guard rails', 'Non-slip planks'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Welding Machine (MIG, 200A)',
    description: 'Joins metal pieces for structural work.',
    category: 'Welding Equipment',
    ratePerDay: 95,
    available: true,
    ownerName: 'Weld Pro Services',
    location: 'Eden Terrace',
    features: ['Digital display', 'Wire feed motor', 'Thermal overload'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Pressure Washer (3000 PSI)',
    description: 'Cleans equipment, surfaces, or buildings.',
    category: 'Cleaning Equipment',
    ratePerDay: 75,
    available: true,
    ownerName: 'Clean Force',
    location: 'Meadowbank',
    features: ['Hot water option', 'Adjustable pressure', 'Chemical injection'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Wood Chipper (6-inch)',
    description: 'Shreds branches and wood waste for disposal.',
    category: 'Landscaping',
    ratePerDay: 180,
    available: true,
    ownerName: 'Chip Away Equipment',
    location: 'Titirangi',
    features: ['Self-feeding', 'Hydraulic feed control', 'Discharge chute'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Lawn Mower (Ride-On)',
    description: 'Cuts large lawns or fields efficiently.',
    category: 'Landscaping',
    ratePerDay: 95,
    available: true,
    ownerName: 'Mow Pro',
    location: 'Mangere East',
    features: ['Zero turn radius', 'Mulching deck', 'Comfortable seat'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Post Hole Digger (Hydraulic)',
    description: 'Digs holes for fencing or signage.',
    category: 'Excavation',
    ratePerDay: 280,
    available: true,
    ownerName: 'Hole Diggers Ltd',
    location: 'Lynfield',
    features: ['PTO driven', 'Various auger sizes', 'Heavy duty gearbox'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Chain Saw (Gas-Powered)',
    description: 'Cuts trees or large branches for clearing.',
    category: 'Cutting Tools',
    ratePerDay: 65,
    available: true,
    ownerName: 'Cut Clean',
    location: 'Kelston',
    features: ['Anti-vibration', 'Quick tensioning', 'Easy start system'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: 'Tile Cutter (Wet Saw)',
    description: 'Precision cutting for ceramic or stone tiles.',
    category: 'Cutting Tools',
    ratePerDay: 85,
    available: true,
    ownerName: 'Precision Cuts',
    location: 'Epsom',
    features: ['Water cooling', 'Laser guide', 'Extension table'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-d0db6de23d2d?w=400'
  },
  {
    name: 'Grinder (Angle, 9-inch)',
    description: 'Shapes or smooths metal and stone surfaces.',
    category: 'Power Tools',
    ratePerDay: 45,
    available: true,
    ownerName: 'Grind Perfect',
    location: 'Mt Albert',
    features: ['Variable speed', 'Safety guard', 'Anti-vibration handle'],
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400'
  },
  {
    name: 'Heat Gun (1500W)',
    description: 'Softens materials for removal or shaping.',
    category: 'Power Tools',
    ratePerDay: 35,
    available: true,
    ownerName: 'Heat Solutions',
    location: 'Sandringham',
    features: ['Variable temperature', 'Multiple attachments', 'Overload protection'],
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400'
  },
  {
    name: 'Plastering Machine',
    description: 'Automates plaster application on walls.',
    category: 'Construction Tools',
    ratePerDay: 450,
    available: true,
    ownerName: 'Plaster Pro',
    location: 'Massey',
    features: ['Continuous mixing', 'Variable output', 'Easy cleaning'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Sandblaster (Portable)',
    description: 'Cleans or preps surfaces with abrasive media.',
    category: 'Surface Preparation',
    ratePerDay: 120,
    available: true,
    ownerName: 'Blast Clean Services',
    location: 'Blockhouse Bay',
    features: ['Moisture trap', 'Adjustable flow', 'Large capacity hopper'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Paint Sprayer (Airless)',
    description: 'Applies paint quickly over large areas.',
    category: 'Painting Equipment',
    ratePerDay: 95,
    available: true,
    ownerName: 'Spray Masters',
    location: 'Mission Bay',
    features: ['Variable pressure', 'Reversible tip', 'Hose length 15m'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Pipe Threader',
    description: 'Cuts and threads pipes for plumbing installations.',
    category: 'Plumbing Tools',
    ratePerDay: 85,
    available: true,
    ownerName: 'Thread Right',
    location: 'Herne Bay',
    features: ['Auto oiling', 'Digital display', 'Multiple pipe sizes'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  },
  {
    name: 'Laser Level (Rotary)',
    description: 'Ensures precise leveling for construction layouts.',
    category: 'Survey Equipment',
    ratePerDay: 75,
    available: true,
    ownerName: 'Level Best Equipment',
    location: 'Grey Lynn',
    features: ['Self-leveling', 'Remote control', 'Long battery life'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'
  }
];

function PopulateFirebase() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  // Demo owner IDs (replace with real user IDs if needed)
  const demoOwnerIds = [
    currentUser?.uid || 'demo-owner-1',
    'demo-owner-2',
    'demo-owner-3',
    'demo-owner-4',
    'demo-owner-5'
  ];

  const populateEquipment = async () => {
    setLoading(true);
    setStatus('Starting to populate Firebase...');
    setProgress(0);
    setResults(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sampleEquipment.length; i++) {
        const equipment = sampleEquipment[i];

        // Update progress
        setProgress(Math.round(((i + 1) / sampleEquipment.length) * 100));
        setStatus(`Adding equipment ${i + 1}/${sampleEquipment.length}: ${equipment.name}`);

        // Assign a random demo owner ID
        const randomOwnerId = demoOwnerIds[Math.floor(Math.random() * demoOwnerIds.length)];

        const equipmentData = {
          ...equipment,
          ownerId: randomOwnerId,
          status: 'approved',
          available: equipment.available !== undefined ? equipment.available : true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          views: Math.floor(Math.random() * 100),
          rentals: Math.floor(Math.random() * 20),
        };

        try {
          const docRef = await addDoc(collection(db, 'equipment'), equipmentData);
          console.log(`✅ Added: ${equipment.name} (ID: ${docRef.id})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to add: ${equipment.name}`, error);
          errorCount++;
        }

        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults({ success: successCount, errors: errorCount });
      setStatus(`✅ Completed! Added ${successCount} equipment items successfully`);

      if (errorCount > 0) {
        setStatus(prev => prev + ` (${errorCount} errors)`);
      }

    } catch (error) {
      console.error('❌ Critical error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const clearAllEquipment = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL equipment? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setStatus('Clearing all equipment...');

    try {
      const snapshot = await getDocs(collection(db, 'equipment'));
      setStatus(`Found ${snapshot.docs.length} equipment items to delete...`);

      let deleteCount = 0;
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deleteCount++;
        setStatus(`Deleting... (${deleteCount}/${snapshot.docs.length})`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setStatus(`✅ Successfully deleted ${deleteCount} equipment items`);
      setResults({ deleted: deleteCount });
    } catch (error) {
      console.error('❌ Error clearing equipment:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentEquipment = async () => {
    setLoading(true);
    setStatus('Checking current equipment in Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'equipment'));
      const equipment = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const categories = [...new Set(equipment.map(item => item.category))];
      const availableCount = equipment.filter(item => item.available).length;

      setStatus(`Found ${equipment.length} equipment items in ${categories.length} categories (${availableCount} available)`);
      setResults({
        total: equipment.length,
        categories: categories.length,
        available: availableCount,
        categoryList: categories
      });
    } catch (error) {
      console.error('❌ Error checking equipment:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🔧 Firebase Equipment Population Tool</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6>🛠️ What this tool does:</h6>
                <ul className="mb-0">
                  <li>Adds {sampleEquipment.length} sample equipment items to your Firebase database</li>
                  <li>Each item gets assigned a random owner ID</li>
                  <li>All items are set to "approved" status</li>
                  <li>Includes realistic images and data</li>
                  <li>Multiple categories: Construction Equipment, Power Tools, Aerial Equipment, etc.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2 mb-4">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={populateEquipment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Adding Equipment... ({progress}%)
                    </>
                  ) : (
                    <>
                      🚀 Populate Firebase with {sampleEquipment.length} Equipment Items
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-info"
                  onClick={checkCurrentEquipment}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : '🔍 Check Current Equipment Count'}
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={clearAllEquipment}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : '🗑️ Clear All Equipment (Dangerous!)'}
                </button>
              </div>

              {/* Progress Bar */}
              {loading && progress > 0 && (
                <div className="mb-3">
                  <div className="progress">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                    >
                      {progress}%
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              {status && (
                <div className={`alert ${status.includes('❌') ? 'alert-danger' :
                  status.includes('✅') ? 'alert-success' :
                    'alert-info'}`}>
                  <pre className="mb-0" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {status}
                  </pre>
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="card mt-3">
                  <div className="card-header">
                    <h6 className="mb-0">📊 Results</h6>
                  </div>
                  <div className="card-body">
                    {results.success !== undefined && (
                      <div>
                        <p className="mb-1"><strong>✅ Successfully added:</strong> {results.success} items</p>
                        {results.errors > 0 && (
                          <p className="mb-1 text-danger"><strong>❌ Errors:</strong> {results.errors} items</p>
                        )}
                      </div>
                    )}

                    {results.total !== undefined && (
                      <div>
                        <p className="mb-1"><strong>📦 Total Equipment:</strong> {results.total}</p>
                        <p className="mb-1"><strong>✅ Available:</strong> {results.available}</p>
                        <p className="mb-1"><strong>🏷️ Categories:</strong> {results.categories}</p>
                        {results.categoryList && (
                          <div className="mt-2">
                            <small><strong>Category List:</strong></small>
                            <div className="mt-1">
                              {results.categoryList.map(cat => (
                                <span key={cat} className="badge bg-secondary me-1 mb-1">{cat}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {results.deleted !== undefined && (
                      <p className="mb-1 text-danger"><strong>🗑️ Deleted:</strong> {results.deleted} items</p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="card mt-3">
                <div className="card-header">
                  <h6 className="mb-0">📝 Instructions</h6>
                </div>
                <div className="card-body">
                  <ol>
                    <li>Click "Check Current Equipment Count" to see what's already in your database</li>
                    <li>Click "Populate Firebase" to add all {sampleEquipment.length} sample equipment items</li>
                    <li>Go to your Renter Dashboard to see all the new equipment</li>
                    <li>Use "Clear All Equipment" only if you want to start fresh (be careful!)</li>
                  </ol>

                  <div className="alert alert-warning mt-3">
                    <small>
                      <strong>⚠️ Note:</strong> This tool assigns random owner IDs to equipment.
                      In a real app, each piece of equipment would belong to the user who added it.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PopulateFirebase;

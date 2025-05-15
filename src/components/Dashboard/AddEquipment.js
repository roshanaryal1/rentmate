import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import './AddEquipment.css';


// Complete equipment list with all 40 items
const equipmentList = [
  // Heavy machinery
  { name: "Excavator (30-ton)", category: "Heavy Machinery", description: "A heavy-duty digging machine for large-scale earthmoving projects.", suggestedPrice: 450 },
  { name: "Excavator (70-ton)", category: "Heavy Machinery", description: "Ideal for deep excavation and heavy material handling.", suggestedPrice: 650 },
  { name: "Bulldozer (D6)", category: "Heavy Machinery", description: "Used for pushing large quantities of soil, sand, or rubble.", suggestedPrice: 500 },
  { name: "Bulldozer (D9)", category: "Heavy Machinery", description: "Designed for large-scale land clearing and grading.", suggestedPrice: 750 },
  { name: "Backhoe Loader", category: "Heavy Machinery", description: "Versatile machine for digging and loading in smaller construction sites.", suggestedPrice: 350 },
  
  // Material Handling
  { name: "Forklift (5,000 lbs capacity)", category: "Material Handling", description: "Used for lifting and transporting materials in warehouses.", suggestedPrice: 250 },
  { name: "Telehandler (Skytrak 10042)", category: "Material Handling", description: "All-terrain forklift with extendable boom for varied heights.", suggestedPrice: 400 },
  { name: "Wheel Loader (Cat 966)", category: "Material Handling", description: "Efficient for loading trucks with loose materials like gravel.", suggestedPrice: 450 },
  { name: "Skid Steer Loader", category: "Material Handling", description: "Compact loader for tight spaces and landscaping tasks.", suggestedPrice: 200 },
  
  // Concrete Equipment
  { name: "Concrete Mixer (1.5 cu yd)", category: "Concrete Equipment", description: "Mixes concrete on-site for small to medium pours.", suggestedPrice: 80 },
  { name: "Concrete Saw (Walk-Behind)", category: "Concrete Equipment", description: "Cuts concrete slabs for repairs or expansions.", suggestedPrice: 120 },
  { name: "Concrete Pump (Trailer-Mounted)", category: "Concrete Equipment", description: "Pumps concrete to hard-to-reach areas.", suggestedPrice: 350 },
  
  // Power Tools
  { name: "Power Drill (Cordless, 18V)", category: "Power Tools", description: "High-torque drill for construction and DIY projects.", suggestedPrice: 25 },
  { name: "Orbital Sander", category: "Power Tools", description: "Smooths wood or metal surfaces with precision.", suggestedPrice: 30 },
  { name: "Jackhammer (Electric)", category: "Power Tools", description: "Breaks up concrete or asphalt with precision.", suggestedPrice: 85 },
  { name: "Welding Machine (MIG, 200A)", category: "Power Tools", description: "Joins metal pieces for structural work.", suggestedPrice: 75 },
  
  // Aerial Lifts
  { name: "Scissor Lift (19' Electric)", category: "Aerial Lifts", description: "Elevates workers safely for indoor tasks up to 19 feet.", suggestedPrice: 180 },
  { name: "Scissor Lift (32' Electric)", category: "Aerial Lifts", description: "Higher reach for indoor maintenance and construction.", suggestedPrice: 250 },
  { name: "Boom Lift (40' Articulating)", category: "Aerial Lifts", description: "Provides flexible reach for outdoor elevated work.", suggestedPrice: 350 },
  { name: "Boom Lift (45' Articulating)", category: "Aerial Lifts", description: "Extended reach for complex outdoor projects.", suggestedPrice: 400 },
  
  // Vehicles
  { name: "Dump Truck (10-cube)", category: "Vehicles", description: "Transports loose materials like sand or gravel.", suggestedPrice: 300 },
  { name: "Articulated Dump Truck (40-ton)", category: "Vehicles", description: "Heavy-duty hauler for rough terrains.", suggestedPrice: 450 },
  { name: "Articulated Dump Truck (45-ton)", category: "Vehicles", description: "Larger capacity for industrial-scale transport.", suggestedPrice: 500 },
  
  // Foundation Equipment
  { name: "Pile Driver (Hydraulic)", category: "Foundation Equipment", description: "Drives piles into the ground for foundation work.", suggestedPrice: 400 },
  
  // Pumps
  { name: "Water Pump (2-inch)", category: "Pumps", description: "Removes water from construction sites or flooded areas.", suggestedPrice: 45 },
  
  // Landscaping
  { name: "Stump Grinder", category: "Landscaping", description: "Grinds tree stumps for land clearing and landscaping.", suggestedPrice: 150 },
  { name: "Wood Chipper (6-inch)", category: "Landscaping", description: "Shreds branches and wood waste for disposal.", suggestedPrice: 120 },
  { name: "Lawn Mower (Ride-On)", category: "Landscaping", description: "Cuts large lawns or fields efficiently.", suggestedPrice: 60 },
  
  // Excavation
  { name: "Trencher (Walk-Behind)", category: "Excavation", description: "Digs narrow trenches for utilities or irrigation.", suggestedPrice: 90 },
  { name: "Trencher (Ride-On)", category: "Excavation", description: "Larger machine for deeper and wider trenching projects.", suggestedPrice: 180 },
  
  // Compaction
  { name: "Compactor (Plate)", category: "Compaction", description: "Compacts soil or asphalt for stable surfaces.", suggestedPrice: 65 },
  { name: "Compactor (Roller)", category: "Compaction", description: "Smooths and compacts large areas like roads or parking lots.", suggestedPrice: 200 },
  { name: "Road Roller (Single Drum)", category: "Road Equipment", description: "Compacts asphalt or gravel for road construction.", suggestedPrice: 350 },
  
  // Power Equipment
  { name: "Air Compressor (Portable, 185 CFM)", category: "Power Equipment", description: "Powers pneumatic tools on-site.", suggestedPrice: 55 },
  { name: "Generator (10 kW)", category: "Power Equipment", description: "Provides temporary power for tools and lighting.", suggestedPrice: 85 },
  { name: "Generator (20 kW)", category: "Power Equipment", description: "Higher capacity for larger construction sites.", suggestedPrice: 150 },
  
  // Cranes
  { name: "Crane (Mobile, 30-ton)", category: "Cranes", description: "Lifts heavy materials to heights on construction sites.", suggestedPrice: 600 },
  { name: "Crane (Tower, 50-ton)", category: "Cranes", description: "Stationary crane for high-rise building projects.", suggestedPrice: 850 },
  
  // Safety Equipment
  { name: "Scaffolding System (Modular)", category: "Safety Equipment", description: "Provides safe platforms for workers at height.", suggestedPrice: 30 },
  
  // Cleaning Equipment
  { name: "Pressure Washer (3000 PSI)", category: "Cleaning Equipment", description: "Cleans equipment, surfaces, or buildings.", suggestedPrice: 40 }
];

// Get unique categories
const categories = [...new Set(equipmentList.map(item => item.category))];

function AddEquipment() {
  const [formData, setFormData] = useState({
    selectedEquipment: '',
    ratePerDay: '',
    location: '',
    condition: 'excellent',
    additionalNotes: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Filter equipment by category
  const filteredEquipment = selectedCategory 
    ? equipmentList.filter(item => item.category === selectedCategory)
    : equipmentList;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill suggested price when equipment is selected
    if (name === 'selectedEquipment') {
      const selectedItem = equipmentList.find(item => item.name === value);
      if (selectedItem && !formData.ratePerDay) {
        setFormData({
          ...formData,
          [name]: value,
          ratePerDay: selectedItem.suggestedPrice
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    // Reset selected equipment when category changes
    setFormData({
      ...formData,
      selectedEquipment: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.selectedEquipment || !formData.ratePerDay || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.ratePerDay <= 0) {
      setError('Please enter a valid rate per day');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const selectedEquipmentItem = equipmentList.find(item => item.name === formData.selectedEquipment);
      
      const equipmentData = {
        name: selectedEquipmentItem.name,
        category: selectedEquipmentItem.category,
        description: selectedEquipmentItem.description,
        ratePerDay: parseFloat(formData.ratePerDay),
        location: formData.location,
        condition: formData.condition,
        additionalNotes: formData.additionalNotes,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || currentUser.email,
        available: true,
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "equipment"), equipmentData);
      console.log("Equipment added with ID: ", docRef.id);
      
      setSuccess('Equipment added successfully! It will be visible once approved by admin.');
      
      // Reset form
      setFormData({
        selectedEquipment: '',
        ratePerDay: '',
        location: '',
        condition: 'excellent',
        additionalNotes: '',
        images: []
      });
      setSelectedCategory('');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to add equipment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickFillDemo = () => {
    const randomItem = equipmentList[Math.floor(Math.random() * equipmentList.length)];
    setFormData({
      selectedEquipment: randomItem.name,
      ratePerDay: randomItem.suggestedPrice + Math.floor(Math.random() * 50) - 25, // ±25 variation
      location: 'Demo Location, City, State',
      condition: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
      additionalNotes: 'This is demo equipment for testing purposes. All equipment is regularly maintained and inspected.'
    });
    setSelectedCategory(randomItem.category);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center">
              <h3><i className="fas fa-plus-circle me-2"></i>Add Equipment to Rent</h3>
              <p className="mb-0">List your equipment and start earning today</p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger"><i className="fas fa-exclamation-triangle me-2"></i>{error}</Alert>}
              {success && <Alert variant="success"><i className="fas fa-check-circle me-2"></i>{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-list me-2"></i>Category</Form.Label>
                      <Form.Select 
                        value={selectedCategory} 
                        onChange={handleCategoryChange}
                      >
                        <option value="">All Categories</option>
                        {categories.map((category, index) => (
                          <option key={index} value={category}>{category}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-tools me-2"></i>Select Equipment *</Form.Label>
                      <Form.Select
                        name="selectedEquipment"
                        value={formData.selectedEquipment}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Choose equipment...</option>
                        {filteredEquipment.map((item, index) => (
                          <option key={index} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {formData.selectedEquipment && (
                  <Alert variant="info">
                    <strong>Description:</strong> {equipmentList.find(item => item.name === formData.selectedEquipment)?.description}
                  </Alert>
                )}

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-dollar-sign me-2"></i>Rate per Day ($) *</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Form.Control
                          name="ratePerDay"
                          type="number"
                          min="1"
                          step="0.01"
                          value={formData.ratePerDay}
                          onChange={handleChange}
                          placeholder="Enter daily rate"
                          required
                        />
                      </div>
                      {formData.selectedEquipment && (
                        <Form.Text className="text-muted">
                          Suggested: ${equipmentList.find(item => item.name === formData.selectedEquipment)?.suggestedPrice}/day
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-map-marker-alt me-2"></i>Location/Address *</Form.Label>
                      <Form.Control
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter equipment location"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-star me-2"></i>Condition</Form.Label>
                  <Form.Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="excellent">Excellent - Like new, minimal wear</option>
                    <option value="good">Good - Well-maintained with minor wear</option>
                    <option value="fair">Fair - Functional with visible wear</option>
                    <option value="poor">Poor - Functional but needs attention</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-comment me-2"></i>Additional Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    placeholder="Any additional information about the equipment, special instructions, or requirements..."
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col className="text-center">
                    <Button 
                      type="button" 
                      variant="outline-secondary" 
                      onClick={quickFillDemo}
                      className="me-3"
                    >
                      <i className="fas fa-magic me-2"></i>Quick Fill Demo
                    </Button>
                  </Col>
                </Row>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/dashboard')}
                    className="me-md-2"
                  >
                    <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>Add Equipment
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddEquipment; 
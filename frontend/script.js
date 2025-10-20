// --- AMBULANCE ICON ---
var ambulanceIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png',
    iconSize: [40, 40],
});

window.onload = function () {
    const statusPanel = document.getElementById('status-panel');
    const ambulanceList = document.getElementById('ambulance-list');
    var map;
    const ambulanceData = {}; 

    async function setupDashboard() {
        try {
            // Fetch initial dashboard data (ambulances, hospitals)
            const response = await fetch('http://127.0.0.1:5000/api/dashboard-data');
            const data = await response.json();
            const hospital = data.hospitals[0];
            const ambulances = data.ambulances;
            const hospitalLocation = [hospital.location.lat, hospital.location.lng];

            map = L.map('map').setView(hospitalLocation, 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

            L.marker(hospitalLocation).addTo(map).bindPopup(`<b>${hospital.name}</b><br>Destination.`).openPopup();
            
            renderHospitalStatus(hospital);
            await createAmbulances(ambulances, hospitalLocation);
            
            // --- NEW: Fetch and draw the traffic overlay ---
            drawTrafficOverlay();

            setInterval(simulationTick, 2000);

        } catch (error) {
            console.error('Error setting up dashboard:', error);
            statusPanel.innerHTML = '<h2>Error</h2><p>Could not connect to the backend server.</p>';
        }
    }
    
    // --- NEW FUNCTION TO DRAW TRAFFIC OVERLAY ---
    async function drawTrafficOverlay() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/traffic-overlay');
            const trafficData = await response.json();

            trafficData.forEach(road => {
                let color;
                if (road.status === 'high') {
                    color = 'red';
                } else if (road.status === 'moderate') {
                    color = 'orange';
                } else {
                    color = 'green';
                }
                L.polyline(road.path, { color: color, weight: 6, opacity: 0.7 }).addTo(map);
            });
        } catch (error) {
            console.error("Failed to fetch traffic overlay data:", error);
        }
    }
    
    // --- (All other JavaScript functions remain the same) ---
    function simulationTick() {
        for (const id in ambulanceData) {
            const ambulance = ambulanceData[id];
            if (ambulance.status === 'Reached') continue;
            let targetPoint = ambulance.routePoints[ambulance.routeIndex];
            ambulance.marker.setLatLng(targetPoint);
            if (ambulance.routeIndex < ambulance.routePoints.length - 1) {
                ambulance.routeIndex++;
            } else {
                ambulance.status = 'Reached';
            }
            const listItem = document.getElementById(`ambulance-${id}`);
            const etaSpan = listItem.querySelector('.eta');
            ambulance.eta -= (2 / 60); 
            if (ambulance.status === 'Reached' || ambulance.eta <= 0) {
                etaSpan.innerHTML = `<strong>Reached</strong>`;
                listItem.classList.add('reached');
                ambulance.status = 'Reached';
            } else {
                etaSpan.innerHTML = `<strong>ETA:</strong> ${Math.ceil(ambulance.eta)} Mins`;
            }
        }
    }

    async function createAmbulances(ambulances, hospitalLocation) {
        let ambulanceHTML = '<h2>🚑 Incoming Ambulances</h2>';
        for (const ambulance of ambulances) {
            ambulanceHTML += `<div class="ambulance-item" id="ambulance-${ambulance.id}"><span>${ambulance.id}</span><span class="eta"><strong>ETA:</strong> ${ambulance.eta_minutes} Mins</span></div>`;
            const ambulanceCoords = [ambulance.location.lat, ambulance.location.lng];
            const marker = L.marker(ambulanceCoords, { icon: ambulanceIcon }).addTo(map).bindPopup(`<b>Ambulance ${ambulance.id}</b>`);
            const routePoints = await fetchRoute(ambulanceCoords, hospitalLocation);
            ambulanceData[ambulance.id] = { marker, routePoints, routeIndex: 0, status: 'En Route', eta: ambulance.eta_minutes };
        }
        ambulanceList.innerHTML = ambulanceHTML;
    }

    async function fetchRoute(startCoords, endCoords) {
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        const latLngs = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        L.polyline(latLngs, { color: 'blue', weight: 5 }).addTo(map);
        return latLngs;
    }

    function renderHospitalStatus(hospital) {
        statusPanel.innerHTML = `<h2>🏥 Hospital Status</h2><p><strong>ICU Beds Avail:</strong> ${hospital.status.icu_beds_available} / ${hospital.status.icu_beds_total}</p><p><strong>ER Capacity:</strong> ${hospital.status.er_capacity}</p>`;
    }
    
    setupDashboard();
};
document.addEventListener('DOMContentLoaded', () => {
    const statusPanel = document.getElementById('status-panel');
    const ambulanceList = document.getElementById('ambulance-list');

    // Fetch data from your mock JSON file
    fetch('mock_data.json')
        .then(response => response.json())
        .then(data => {
            renderHospitalStatus(data.hospitals[0]);
            renderAmbulances(data.ambulances);
        })
        .catch(error => console.error('Error loading data:', error));

    function renderHospitalStatus(hospital) {
        statusPanel.innerHTML = `
            <h2>🏥 Hospital Status</h2>
            <p><strong>ICU Beds Avail:</strong> ${hospital.status.icu_beds_available} / ${hospital.status.icu_beds_total}</p>
            <p><strong>ER Capacity:</strong> ${hospital.status.er_capacity}</p>
        `;
    }

    function renderAmbulances(ambulances) {
        // Start the HTML string for the list
        let ambulanceHTML = '<h2>🚑 Incoming Ambulances</h2>';
        
        // Loop through each ambulance and add it to the HTML string
        ambulances.forEach(ambulance => {
            ambulanceHTML += `
                <div class="ambulance-item">
                    <span>${ambulance.id}</span>
                    <span><strong>ETA:</strong> ${ambulance.eta_minutes} Mins</span>
                </div>
            `;
        });
        
        // Set the final HTML to the container
        ambulanceList.innerHTML = ambulanceHTML;
    }
});
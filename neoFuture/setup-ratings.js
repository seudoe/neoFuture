// Simple script to create the ratings table
// Run this once to set up the ratings functionality

async function setupRatings() {
    try {
        console.log('Setting up ratings table...');

        const response = await fetch('http://localhost:3000/api/create-ratings-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Ratings table created successfully!');
        } else {
            console.error('❌ Failed to create ratings table:', result.error);
        }
    } catch (error) {
        console.error('❌ Error setting up ratings:', error);
    }
}

// Run the setup if this file is executed directly
if (typeof window === 'undefined') {
    setupRatings();
}

module.exports = { setupRatings };
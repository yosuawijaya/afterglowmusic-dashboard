// Test API send-release
const testData = {
  title: 'Test Release',
  artist: 'Test Artist',
  label: 'Afterglow Music',
  releaseDate: '2026-04-01',
  genre: 'Pop',
  format: 'Single',
  price: 'standard',
  territories: 'worldwide',
  promotionText: 'This is a test release submission',
  userEmail: 'mamangmusica@outlook.com', // Email user yang submit
  tracks: [
    {
      title: 'Test Track 1',
      artist: 'Test Artist',
      driveLink: 'https://drive.google.com/file/d/test123'
    }
  ],
  coverImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

fetch('http://localhost:3002/api/send-release', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Success:', data)
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

// Test script untuk kirim email
// Jalankan: node test-email.js

const testData = {
  title: "Test Release - Beautiful Song",
  artist: "Yosua Wijaya",
  label: "Afterglow Music",
  releaseDate: "2026-04-15",
  genre: "Pop",
  format: "Single",
  price: "standard",
  territories: "worldwide",
  promotionText: "This is a test release submission from Afterglow Music Dashboard. Excited to share this new music with the world!",
  tracks: [
    {
      title: "Beautiful Song",
      artist: "Yosua Wijaya",
      driveLink: "https://drive.google.com/file/d/1234567890/view"
    },
    {
      title: "Beautiful Song (Acoustic)",
      artist: "Yosua Wijaya",
      driveLink: "https://drive.google.com/file/d/0987654321/view"
    }
  ],
  coverImage: null
}

fetch('http://localhost:3000/api/send-release', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Success!', data)
  console.log('\n📧 Email sent to:', process.env.RECIPIENT_EMAIL || 'yosuaawijayaaa@gmail.com')
  console.log('Check your inbox!')
})
.catch(error => {
  console.error('❌ Error:', error)
})

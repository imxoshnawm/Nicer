const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/nicerclub').then(async () => {
    const db = mongoose.connection.db;
    
    // Set imageUrl on one activity
    const result = await db.collection('activities').updateOne(
        { title: 'vnxmvn mvn' },
        { $set: { imageUrl: '/uploads/1772869291380-ybxpudit.jpg' } }
    );
    console.log('Updated:', result.modifiedCount);
    
    // Verify
    const doc = await db.collection('activities').findOne({ title: 'vnxmvn mvn' });
    console.log('imageUrl:', doc.imageUrl);
    
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/nicerclub').then(async () => {
    const db = mongoose.connection.db;
    
    // Step 1: Create an activity with imageUrl directly
    console.log('Step 1: Creating activity with imageUrl...');
    const result = await db.collection('activities').insertOne({
        title: 'TEST_IMAGE_DIRECT',
        titleKu: '',
        titleAr: '',
        description: 'Test description for image test',
        descriptionKu: '',
        descriptionAr: '',
        date: new Date('2026-06-15'),
        location: 'Test Location',
        imageUrl: '/uploads/1772869291380-ybxpudit.jpg',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log('Created with id:', result.insertedId.toString());
    
    // Step 2: Read it back through Mongoose model
    console.log('\nStep 2: Reading back through Mongoose...');
    
    // Load the Activity model
    const ActivitySchema = new mongoose.Schema({
        title: { type: String, required: true },
        titleKu: { type: String, default: '' },
        titleAr: { type: String, default: '' },
        description: { type: String, required: true },
        descriptionKu: { type: String, default: '' },
        descriptionAr: { type: String, default: '' },
        date: { type: Date, required: true },
        location: { type: String, default: '' },
        imageUrl: { type: String, default: '', maxlength: 2048 },
        status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    }, { timestamps: true });
    
    const Activity = mongoose.model('Activity', ActivitySchema);
    
    const allActivities = await Activity.find({}).lean();
    console.log('\nAll activities:');
    allActivities.forEach(a => {
        console.log(`  - ${a.title} | imageUrl: "${a.imageUrl}" | type: ${typeof a.imageUrl}`);
    });
    
    // Step 3: Test pickFields-like behavior
    console.log('\nStep 3: Testing pickFields behavior...');
    const testBody = {
        title: 'test',
        imageUrl: '/uploads/1772869291380-ybxpudit.jpg',
    };
    const allowedFields = ['title', 'titleKu', 'titleAr', 'description', 'descriptionKu', 'descriptionAr', 'date', 'location', 'imageUrl', 'status'];
    const result2 = {};
    for (const field of allowedFields) {
        if (testBody.hasOwnProperty(field) && testBody[field] !== undefined) {
            result2[field] = testBody[field];
        }
    }
    console.log('pickFields result:', result2);
    console.log('imageUrl in result:', result2.imageUrl);
    
    // Step 4: Test sanitizeString behavior
    console.log('\nStep 4: Testing sanitizeString...');
    const url = '/uploads/1772869291380-ybxpudit.jpg';
    const sanitized = url
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '')
        .trim();
    console.log('Original URL:', url);
    console.log('Sanitized URL:', sanitized);
    console.log('Match:', url === sanitized);
    
    // Cleanup test data
    await db.collection('activities').deleteOne({ _id: result.insertedId });
    console.log('\nCleaned up test activity');
    
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

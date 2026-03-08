// Test creating an activity through the API
async function testActivityCreate() {
    try {
        // Step 1: Get CSRF token
        console.log('Step 1: Getting CSRF token...');
        const csrfRes = await fetch('http://localhost:3000/api/csrf');
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.token;
        const csrfCookie = csrfRes.headers.get('set-cookie');
        console.log('CSRF token:', csrfToken ? 'got it' : 'MISSING');
        console.log('CSRF cookie header:', csrfCookie ? csrfCookie.substring(0, 50) + '...' : 'MISSING');

        // Step 2: Try to create an activity with imageUrl
        console.log('\nStep 2: Creating activity with imageUrl...');
        const payload = {
            title: 'TEST_WITH_IMAGE',
            description: 'Test description content here',
            date: '2026-06-15',
            location: 'Test Location',
            status: 'upcoming',
            imageUrl: '/uploads/1772869291380-ybxpudit.jpg'
        };
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
        };
        if (csrfCookie) {
            headers['Cookie'] = csrfCookie.split(';')[0];
        }

        const createRes = await fetch('http://localhost:3000/api/activities', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        console.log('Response status:', createRes.status, createRes.statusText);
        const responseBody = await createRes.text();
        console.log('Response body:', responseBody);

        if (createRes.ok) {
            const created = JSON.parse(responseBody);
            console.log('\n✅ Activity created!');
            console.log('imageUrl in response:', created.imageUrl);
        } else {
            console.log('\n❌ Failed to create activity');
            console.log('This is likely the root cause!');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

testActivityCreate();

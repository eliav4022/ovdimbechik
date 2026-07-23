import React, { useEffect } from 'react';
import { setDoc, collection, doc } from './src/lib/firestore-audit.ts';
import { db } from './src/lib/firebase.ts';

export const TestComponent = () => {
    useEffect(() => {
        const test = async () => {
            const newRef = doc(collection(db, 'jobs'));
            await setDoc(newRef, { title: 'Test Job 123' });
            console.log("Job created!");
        };
        test();
    }, []);
    return <div>Testing</div>;
}

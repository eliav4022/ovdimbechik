import { serverTimestamp } from "firebase/firestore";
function safeStringify(obj) {
    try {
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (value.constructor && value.constructor.name === 'FieldValue') return 'FieldValue';
                if (value.constructor && value.constructor.name === 'ServerTimestampFieldValueImpl') return 'ServerTimestamp';
            }
            return value;
        });
    } catch(e) { return 'Error stringifying'; }
}
console.log(safeStringify({a: serverTimestamp()}));

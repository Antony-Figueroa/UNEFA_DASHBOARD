import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/db-status');
    console.log('DB Status:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
};

test();

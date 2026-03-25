import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/institutions');
    console.log('Success:', res.data.length, 'institutions');
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
};

test();

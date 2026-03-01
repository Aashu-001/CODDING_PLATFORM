

const axios = require('axios');

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    "java": 62,
    "javascript": 63
  };
  return language[lang.toLowerCase()];
};


// Helper to encode plain text to base64
const encode = (str) => Buffer.from(str ?? '').toString('base64');

// Helper to decode base64 to plain text
const decode = (str) => str ? Buffer.from(str, 'base64').toString('utf8') : null;


const submitBatch = async (submissions) => {

  // Encode source_code, stdin, and expected_output before sending
  const encodedSubmissions = submissions.map((s) => ({
    ...s,
    source_code: encode(s.source_code),
    stdin: encode(s.stdin),
    expected_output: encode(s.expected_output),
  }));

  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      base64_encoded: 'true'   // ✅ was 'false'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      submissions: encodedSubmissions
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  return await fetchData();
};


const waiting = (timer) => {
  return new Promise((resolve) => setTimeout(resolve, timer));
};


const submitToken = async (resultToken) => {

  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'true',  // ✅ was 'false'
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  while (true) {
    const result = await fetchData();

    const IsResultObtained = result.submissions.every((r) => r.status_id > 2);

    if (IsResultObtained) {
      // Decode all base64 fields before returning
      return result.submissions.map((r) => ({
        ...r,
        stdout: decode(r.stdout),
        stderr: decode(r.stderr),
        compile_output: decode(r.compile_output),
        expected_output: decode(r.expected_output),
        stdin: decode(r.stdin),
      }));
    }

    await waiting(1000);
  }
};


module.exports = { getLanguageById, submitBatch, submitToken };


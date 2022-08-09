"use strict";
const TV = {};
module.exports = {
  TV,
};

// TV Webhook URL
// http://169.254.148.40/tv/processTVsignal

// ngrok http 80

TV.processTVsignal = async (req, res) => {
  console.log("Handling TV Signal:", req.body);

  try {
    res.send({ message: "Successfully handled TV Signal" });
  } catch (e) {
    res.status(401).send(e);
  }
};

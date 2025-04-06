const nodemailer = require("nodemailer");
const cron = require("node-cron");
const xlsx = require("xlsx");
const path = require("path");
require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// Loading the Excel file
const filePath = path.join(__dirname, "birthdays.xlsx");
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);


app.post("/add-birthday", (req, res) => {
  const { Name, Email, Birthday } = req.body;

  if (!Name || !Email || !Birthday) {
    return res.status(400).send("All fields are required!");
  }

  // Load or create the workbook
  const workbook = loadWorkbook();
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Append new entry
  data.push({ Name, Email, Birthday });

  // Write back to Excel
  const newSheet = xlsx.utils.json_to_sheet(data);
  workbook.Sheets[workbook.SheetNames[0]] = newSheet;
  xlsx.writeFile(workbook, filePath);

  console.log(`➕ Added ${Name} (${Email}) to Excel.`);
  res.send("Birthday added successfully!");
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // My Gmail address
    pass: process.env.EMAIL_PASS, // My App Password
  },
});

// Function to send email
const sendEmail = (recipient, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: "Happy Birthday! 🎉",
    text: `Dear ${name},\n\nWishing you a very Happy Birthday! Have a fantastic day ahead!\n\nBest wishes,\nTeam ACM`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log(`✅ Birthday email sent to ${name} (${recipient}):`, info.response);
    }
  });
};

// Function to convert Excel serial date to JavaScript Date
const excelSerialDateToJSDate = (serial) => {
  return new Date((serial - 25569) * 86400000); // Convert Excel serial date to JS Date
};

// Function to check birthdays and send emails
const checkAndSendEmails = () => {
    console.log("🔍 Checking for birthdays...");
  
    // Get today's date in YYYY-MM-DD format considering timezone issues
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());  // Adjust for timezone offset
    const formattedToday = today.toISOString().slice(0, 10); // Get today's date as YYYY-MM-DD
  
    console.log(`Today's date: ${formattedToday}`); // Log today's date to verify
  
    data.forEach((person) => {
      if (!person.Birthday) {
        console.log(`⚠️ Skipping ${person.Name} (No birthday found)`);
        return;
      }
  
      // If the birthday is a number (Excel serial date), convert it to a valid date
      let birthDate;
      if (typeof person.Birthday === "number") {
        birthDate = excelSerialDateToJSDate(person.Birthday).toISOString().slice(0, 10);
      } else {
        // If it's already a valid date string, just format it
        birthDate = new Date(person.Birthday).toISOString().slice(0, 10);
      }
    
      if (birthDate === formattedToday) {
        console.log(`🎉 Sending birthday email to ${person.Name} at ${person.Email}...`);
        sendEmail(person.Email, person.Name);
      }
    });
  
    console.log("✅ Birthday check complete.");
  };
  

// Schedule the job to run daily at 11:22 AM (cron expression: "22 11 * * *")
cron.schedule("0 0 * * *", () => {
  console.log("⏳ Running birthday email cron job...");
  checkAndSendEmails();
});

console.log("📨 Birthday email scheduler is running...");

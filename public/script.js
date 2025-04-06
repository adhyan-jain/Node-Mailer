// script.js (aka chaos mode)
document.getElementById("birthdayForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // pls don't refresh bro
  
    const form = e.target;
    const formData = new FormData(form);
    const json = Object.fromEntries(formData.entries()); // black magic
  
    try {
      const res = await fetch("/add-birthday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // JSON is love, JSON is life
        },
        body: JSON.stringify(json),
      });
  
      const msg = await res.text();
      document.getElementById("statusMessage").textContent = msg || "All good!";
      form.reset();
    } catch (error) {
      document.getElementById("statusMessage").textContent = "Something broke!!!";
      console.error("bruh!:", error);
    }
  });
  
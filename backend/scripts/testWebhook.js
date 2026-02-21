import fetch from "node-fetch";

const response = await fetch("http://localhost:3000/api/whatsapp/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              metadata: {
                display_phone_number: "5511999999999",
                phone_number_id: "123"
              },
              messages: [
                {
                  id: "teste123",
                  from: "5511912345678",
                  timestamp: "1730000000",
                  type: "text",
                  text: { body: "mensagem de teste via Node" }
                }
              ]
            }
          }
        ]
      }
    ]
  }),
});

console.log("Status:", response.status);
console.log("Texto:", await response.text());

const url = "https://rpc-amoy.polygon.technology";
const contract = "0xB72c653F28B07be21F82B67DaF0c8599b87CB909";
const from = "0x7dF3BD0Ae3Fab7Aee2cfF6d1f35c0121F6b028B5"; // User wallet

// Function: mintTrack(string,uint96,address)
// Selector: e431cd75
const selector = "e431cd75";
// Args encoding (simplified for basic string/uint/address):
// Since string is dynamic, it's a bit complex to hand-code, but let's try a static call or simple data.
// actually, let's just use the data from the user's error to be EXACT.
const data = "0xe431cd75000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001f40000000000000000000000007df3bd0ae3fab7aee2cff6d1f35c0121f6b028b50000000000000000000000000000000000000000000000000000000000000035697066733a2f2f516d54694d79506166573778516d676443784b554e75676f5135674752557447366e596a767a69636d6a367651500000000000000000000000";

console.log("Simulating Transaction (estimateGas)...");

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_estimateGas",
        params: [{
            from: from,
            to: contract,
            data: data
        }],
        id: 1
    })
})
    .then(async r => {
        const data = await r.json();
        console.log("Response:", JSON.stringify(data));
    })
    .catch(console.error);

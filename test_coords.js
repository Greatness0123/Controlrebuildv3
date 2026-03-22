const ActBackend = require('./src/main/backends/act-backend');
const { screen } = require('electron');

async function test() {
    const act = new ActBackend();

    act.screenSize = {
        width: 1920,
        height: 1080,
        x: 0,
        y: 0
    };

    const action = {
        action: 'click',
        parameters: {
            box2d: [100, 100, 200, 200], // Center at (150, 150) normalized
            label: 'test button',
            confidence: 99
        }
    };

    console.log("Testing coordinate conversion with center (150, 150) on 1920x1080 screen...");

    const result = await act.executeAction(action, () => {});
    console.log("Result:", result.message);

    if (result.message.includes("at (288, 162)")) {
        console.log("SUCCESS: Coordinates match expected values.");
    } else {
        console.log("FAILURE: Coordinates do not match expected values.");
    }

    act.screenSize.x = 1000;
    act.screenSize.y = 500;
    const result2 = await act.executeAction(action, () => {});
    console.log("Result with offset (1000, 500):", result2.message);

    if (result2.message.includes("at (1288, 662)")) {
        console.log("SUCCESS: Coordinates with offset match expected values.");
    } else {
        console.log("FAILURE: Coordinates with offset do not match expected values.");
    }
}

test().catch(console.error);

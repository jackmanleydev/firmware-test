/*
* Copyright 2023 Jack Manley
* jackmanleydev@gmail.com
*/


// #region Element References

// Check for updates
const checkForUpdatesDiv = document.getElementById('check-for-updates-div');
const checkForUpdateButton = document.getElementById('check-update-button');
// Updates found
const updatesFoundDiv = document.getElementById('updates-found-div');
const currentSOCSpan = document.getElementById('current-SOC');
const latestSOCSpan = document.getElementById('latest-SOC');
const downloadFilesButton = document.getElementById('download-files');
const cancelButton = document.getElementById('cancel-download');
// Submit update
const form = document.getElementById('upload-form');
// Uploading
const uploadingDiv = document.getElementById('uploading');
const uploadCompleteDiv = document.getElementById('upload-complete');
const updateButton = document.getElementById('update-firmware');
// Updating
const updatingDiv = document.getElementById('updating');
const updateCompleteDiv = document.getElementById('update-complete');
// Loading bar
const loadingBarContainer = document.getElementById('loading-bar-container');
const loadingBarDiv = document.getElementById('loading-bar');
const loadingPercentage = document.getElementById('loading-percentage');

// #endregion

// #region Event Listeners

// Check for firmware update 
checkForUpdateButton.addEventListener('click', async (event) => {

    // get current version from device
    response = await fetch('/cgi-bin/param.cgi?f=get_device_conf', {
        method: 'GET',
    });
    const deviceConfig = await response.text();

    // parse text response
    const versionKey = 'versioninfo="SOC ';
    const startIndex = deviceConfig.indexOf(versionKey) + versionKey.length;
    const endIndex = deviceConfig.indexOf(' ', startIndex);
    const currentSOC = deviceConfig.slice(startIndex, endIndex);

    // get latest version from cloud
    var response = await fetch('https://firmware.ptzoptics.com/F53.HI/RVU.json', {
        method: 'GET',
    });
    const RVUjson = await response.json();

    // parse JSON
    const latestSOC = RVUjson.data.soc_version;

    if (currentSOC != latestSOC) {
        currentSOCSpan.innerText = currentSOC;
        latestSOCSpan.innerText = latestSOC;

        checkForUpdatesDiv.hidden = true;
        updatesFoundDiv.hidden = false;
    }
    else {
        alert("SOC is up to date: " + latestSOC);
    }
});

// Download firmware and changelog button
downloadFilesButton.addEventListener('click', async (event) => {
    download("https://firmware.ptzoptics.com/F53.HI/VX630A_F53.HI_V2.0.39_24M_20230817.img");
    // wait a second to prevent browser from stopping multiple downloads
    setTimeout(() => { download("https://firmware.ptzoptics.com/F53.HI/upgrade.log") }, 1000); 
});

function download(dataurl) {
    const link = document.createElement("a");
    link.href = dataurl;
    link.click();
}

// Cancel download button
cancelButton.addEventListener('click', async (event) => {
    updatesFoundDiv.hidden = true;
    checkForUpdatesDiv.hidden = false;
});

// Send form data to server
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    form.hidden = true;
    uploadingDiv.hidden = false;
    startProgressBar(10);

    const formData = new FormData(form);
    const response = await fetch('/', {
        method: 'POST',
        body: formData
    });

    uploadingDiv.hidden = true;
    uploadCompleteDiv.hidden = false;
    finishProgress();
});

// Update firmware button
updateButton.addEventListener('click', async (event) => {
    uploadCompleteDiv.hidden = true;
    updatingDiv.hidden = false;
    startProgressBar(30);

    const formData = new FormData(form);
    const response = await fetch('/update', {
        method: 'GET',
    });

    updatingDiv.hidden = true;
    updateCompleteDiv.hidden = false;
    finishProgress();
});

// #endregion

// #region Progress Bar behavior

let intervalID;
let totalTime;
let invervaPercentage;
const intervalTime = 500;
let progressBarWidth = 0;

// Start loading animation for a given time frame
function startProgressBar(time) {
    if (!intervalID) {
        
        totalTime = time;
        progressBarWidth = 0;
        updateProgressBarUI(true);
        loadingBarContainer.hidden = false;
        intervalPercentage = intervalTime / (totalTime * 1000) * 100;
        intervalID = setInterval(updateProgressBar, intervalTime);
    }
}

// Update the progress every interval
function updateProgressBar() {
    progressBarWidth += intervalPercentage;
    if (progressBarWidth >= 100) {
        finishProgress();
    }
    else {
        updateProgressBarUI();
    }
}

// Update the UI with the current progress percentage
function updateProgressBarUI(withoutTransition = false) {
    if (withoutTransition) {
        loadingBarDiv.classList.remove("loadingBarTransition");
    }

    const roundedWidth = Math.round(progressBarWidth) + "%";
    loadingBarDiv.style.width = roundedWidth;
    loadingPercentage.innerText = roundedWidth;

    if (withoutTransition) {
        loadingBarDiv.classList.add("loadingBarTransition");
    }
}

// Set to 100% and clear the interval
function finishProgress() {
    if (intervalID) {
        progressBarWidth = 100;
        clearInterval(intervalID);
        intervalID = "";
        updateProgressBarUI();
    }
}

//#endregion
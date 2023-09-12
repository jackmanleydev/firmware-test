# Front-end Developer Skill Test

Thank you for your interest in the front-end developer position at Haverford Systems, Inc.

As a front end developer at Haverford Systems, Inc., you will be tasked with developing user interfaces for audio and video devices sold through our two brands: PTZOptics and HuddleCamHD.

## About

For this skill assessment, we ask you to develop a firmware updating function. Our cameras receive regular firmware updates which are posted to the cloud at:

    https://firmware.ptzoptics.com

Our cameras can reach out to the cloud to receive a firmware update through a HTTP GET request. Here is a sample cURL request for firmware update information (delivered via RVU.json):

    curl https://firmware.ptzoptics.com/F53.HI/RVU.json

Each camera’s firmware is availble at our web server based on the model identifier. In this case the model identifier is: F53.HI

## RVU.json

RVU.json contains the following information:

    ``` json
    {
        "code": 200,
        "data": {
            "soc_version": "v2.0.39",
            "img_name": "VX630A_F53.HI_V2.0.39_24M_20230817.img",
            "log_name": "upgrade.log",
            "abstracts": "<ol><li>Click Apply to download the new firmware and a changelog</li><li>Expand the Advanced menu below to upgrade</li></ol>",
            "soc_md5": "110dc0a4f9c5ed72c6d950f99d81d82c"
        }
    }
    ```

- soc_version is the current firmware version.
- img_name is the filename of the firmware
- log_name shows the name of the changelog file
- soc_md5 is the md5 checksum for the img_name file

## Get Device Configuration

We can query the SOC version of the camera through a cgi-bin request at the camera’s IP address:

    /cgi-bin/param.cgi?f=get_device_conf

This returns information like the following:

    ```
    devname="ptzoptics" 
    devtype="VX630A" 
    mirrors="https://firmware.ptzoptics.com/" 
    versioninfo="SOC v2.0.36 - ARM 6.0.30SHIS" 
    serial_num="s1i03210186" 
    device_model="F53.HI"
    ```

From this information, you can see that this device has the same device_model as that which we sent the cURL request: F53.HI

You can also see that this device is out of date. The versioninfo key contains an older SOC version: v2.0.36 vs v2.0.39

We need to upgrade this device.

## Upgrade Device

The firmware file is located in the hardware model identifier (device_model) folder. The img_name is the filename:

    https://firmware.ptzoptics.com/F53.HI/VX630A_F53.HI_V2.0.39_24M_20230817.img 

The changelog is located in the hardware model identifier (device_model) folder. The log_name is the filename:

    https://firmware.ptzoptics.com/F53.HI/upgrade.log

## The Test

For your skill assessment, you will emulate the firmware update function of a camera on a local web server. The steps are as follows:

1. Create a web page which will allow a user to query the firmware update server for firmware updates.
2. You will do this by providing a button for the user to send a HTTP GET request for the camera's RVU.json file, i.e. check for firmware update. You will use device_model F53.HI.
3. After receipt of the RVU.json file, check the soc_version against the camera’s SOC version using: /cgi-bin/param.cgi?f=get_device_conf.
4. If the firmware is out of date (it is), prompt the user to download both the firmware and changelog.
5. The user should be prompted to upload the firmware within the upload-form at the web server root (index.html).
6. The firmware upload takes 10 seconds. There will be a JSON response from the server once the file uploads to the camera.
7. Once the firmware is uploaded, the user should be prompted to start the firmware update process.
8. There is an endpoint: /update. A GET request to /update will start the firmware update process. The firmware update process will take 30 seconds. The camera will send a response when the update completes.
9. The user should be informed about the progress of the firmware update. At the end of the update process, the user should be informed that the camera is updated and it will reboot momentarily. There is no need to simulate the reboot process.

## Requirements

All needed code is within this repository.

You will need to install rust to your computer. Instructions are available at this page: [Install Rust](https://www.rust-lang.org/tools/install)

There is no reason to modify any of the rust code. All of your work should be within the public folder. Within this folder are the following files:

- index.html
- scripts/main.js
- styles/main.css

Please accomplish the task by editing the index.html, main.js, and main.css files. You may use whatever tools you want to edit these files. However, there should be no additional dependencies required to run the app.

Start the web server by entering the following command in a terminal at the root of the project repository:

    cargo run

The webserver will be hosted at:

    http://localhost:3000/

index.html is available at the project root. The following routes are available:

- GET / (index.html)
- POST / (upload firmware to server)
- GET /update (update camera firmware)
- GET /scripts/main.js
- GET /styles/main.css
- GET /cgi-bin/param.cgi?f=get_device_conf (get device configuration)

You will see tracing information in the terminal window for debugging purposes.

## Submitting your test

Please add your name, email address, and preferred interview dates in INFO.md. Please submit your test by sending a link with your code to:

    developer.test@haverford.com 

We look forward to receiving your submission!

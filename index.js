const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome ClickYoutube, enter Youtube Link to get your Video Downloaded"
  );
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText.includes("youtube.com")) {
    const videoId = ytdl.getURLVideoID(messageText);
    const downloadLink = `https://www.youtube.com/watch?v=${videoId}`;

    const mp4DownloadPath = `./video_${videoId}.mp4`;
    const mp4DownloadStream = ytdl(downloadLink, {
      filter: (format) => format.container === "mp4",
      quality: "highest",
    });
    const mp4FileStream = fs.createWriteStream(mp4DownloadPath);

    mp4DownloadStream.pipe(mp4FileStream);

    mp4DownloadStream.on("end", () => {
      const mp3DownloadPath = `./aidop_${videoId}.mp3`;
      const mp3DownloadStream = ytdl(downloadLink, {
        filter: (format) => format.container === "mp4",
        quality: "highestaudio",
      });
      const mp3FileStream = fs.createWriteStream(mp3DownloadPath);

      mp3DownloadStream.pipe(mp3FileStream);

      mp3DownloadStream.on("end", () => {
        const mergedFilePath = `./merged_${videoId}.mp4`;
        const command = ffmpeg()
          .input(mp4DownloadPath)
          .input(mp3DownloadPath)
          .output(mergedFilePath)
          .on("end", () => {
            const videoData = fs.readFileSync(mergedFilePath);

            bot.sendVideo(chatId, videoData, {
              caption: "Enjoy your video:)",
            });

            fs.unlinkSync(mp4DownloadPath);
            fs.unlinkSync(mp3DownloadPath);
            fs.unlinkSync(mergedFilePath);
          })
          .on("error", (error) => {
            console.error("Error merging files: ", error);
            bot.sendMessage(chatId, "An error while merging the files");

            fs.unlinkSync(mp4DownloadPath);
            fs.unlinkSync(mp3DownloadPath);
            fs.unlinkSync(mergedFilePath);
          })
          .run();
      });

      mp3DownloadStream.on("error", (error) => {
        console.error("Error downloading audio: ", error);
        bot.sendMessage(chatId, "An error while donloading the audio");
      });
    });

    mp4DownloadStream.on("error", (error) => {
      console.error("Error downloading video: ", error);
      bot.sendMessage(chatId, "An error while donloading the video");
    });
  }
});

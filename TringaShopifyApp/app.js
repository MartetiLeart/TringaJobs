import express from "express";
const app = express();
import bodyparser from "body-parser";
import fetch from "node-fetch";
import he from "he";
import multer from "multer";
import fs from "fs-extra";
import util from "util";
import Path from "path";
import Blob from "blob";
const unlinkFile = util.promisify(fs.unlink);
const upload = multer({ dest: "uploads/" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
import FormData from "form-data";

//1 3 api jobs,departament(locations get from jobs.location.name)
app.get("/greenhouse/jobs", async function (req, res) {
  try {
    let activeLocations = [];
    let activeDepartments = [];
    let greenhouseJobs = await fetch(
      "https://boards-api.greenhouse.io/v1/boards/neatorobotics/jobs?content=true",
      { method: "GET" }
    );
    let greenhouseJobsJson = await greenhouseJobs.json();
    greenhouseJobsJson.jobs.forEach((element) => {
      /**
       * switches content to html
       */
      let decoded = he.decode(element.content);
      let replacedAndDecoded = decoded.replaceAll("\n", "<br>");
      element.content = replacedAndDecoded;

      let locationName = element.location.name;
      let departmentName = element.departments[0].name;
      if (!activeLocations.includes(locationName)) {
        activeLocations.push(locationName);
      }
      if (!departmentName) return;
      activeDepartments.push(departmentName);
    });
    return res.status(200).json({
      success: true,
      greenhouseJobs: greenhouseJobsJson,
      activeDepartments,
      activeLocations,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Unexpected Error" });
  }
});

//2 single job, all gets in jobPost
app.get("/greenhouse/jobs/:id", async function (req, res) {
  try {
    let greenhouseJobID = req.params.id;
    let greenhouseJob = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/neatorobotics/jobs/${greenhouseJobID}?questions=true`,
      { method: "GET" }
    );
    let greenhouseJobJson = await greenhouseJob.json();

    if (greenhouseJobJson.education != undefined) {
      /**
       * switches content to html
       */
      let decoded = he.decode(greenhouseJobJson.content);
      let replacedAndDecoded = decoded.replaceAll("\n", "<br>");
      greenhouseJobJson.content = replacedAndDecoded;

      /**
       * @Description Gets education degrees
       */
      let educationDegrees = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/neatorobotics/education/degrees`,
        { method: "GET" }
      );
      let educationDegreesJson = await educationDegrees.json();

      /**
       * @Description Gets education schools
       */
      let educationSchools = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/neatorobotics/education/schools`,
        { method: "GET" }
      );
      let educationSchoolsJson = await educationSchools.json();

      /**
       * @Description Gets education disciplines
       */
      let educationDisciplines = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/neatorobotics/education/schools`,
        { method: "GET" }
      );
      let educationDisciplinesJson = await educationDisciplines.json();

      return res.status(200).json({
        success: true,
        greenhouseJob: greenhouseJobJson,
        educationDegrees: educationDegreesJson,
        educationSchools: educationSchoolsJson,
        educationDisciplines: educationDisciplinesJson,
      });
    }
    greenhouseJobJson.education = "education_hidden";
    return res.status(200).json({
      success: true,
      greenhouseJobJson,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Unexpected Error" });
  }
});

//3
app.post(
  "/greenhouse/jobs/:id",
  upload.fields([
    { name: "cover_letter", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body;
      const formData = new FormData({ maxDataSize: 2012441923 });

      for (const [key, values] of Object.entries(body)) {
        if (typeof values === "string") {
          formData.append(key, values);
        }
        if (typeof values === "object") {
          for (let i = 0; i < values.length; i++) {
            console.log(values[i]);
            //console.log("loop done");
          }
        }
      }

      // //cover_letter
      // // let cover_letter = await fs.readFileSync(
      // //   req.files["cover_letter"][0].path
      // // );

      // formData.append(
      //   "cover_letter",
      //   fs.readFileSync(req.files["cover_letter"][0].path),
      //   req.files["cover_letter"][0].originalname
      // );

      // //resume
      // // let resume = await fs.readFileSync(req.files["resume"][0].path);

      // formData.append(
      //   "resume",
      //   fs.readFileSync(req.files["resume"][0].path),
      //   req.files["resume"][0].originalname
      // );

      // console.log(req.files);
      // // await fs.writeFileSync("./asd/emri.gif", bah);

      // let greenhouseDisciplines = await fetch(
      //   `https://boards-api.greenhouse.io/v1/boards/neatorobotics/jobs/${id}`,
      //   {
      //     method: "POST",
      //     headers: {
      //       Authorization:
      //         "Basic M2UyODY1NTk2OWNkMjFiNTgyMjVkNDc4MGI1Yjg1MjEtMjo=",
      //     },
      //     body: formData,
      //   }
      // );
      // let greenhouseDisciplinesJson = await greenhouseDisciplines.json();
      // for (const [key, value] of Object.entries(req.files)) {
      //   unlinkFile(value[0].path);
      // }

      // return res.status(200).json({ success: true, greenhouseDisciplinesJson });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Unexpected Error" });
    }
  }
);

app.listen(3000, console.log("You are listening in port 3000"));

import { faker } from "@faker-js/faker";

import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

const ENV = process.env.ENV || "dev";

const TABLE_NAME = {
  USER: `${ENV}-user`,
  PANEL: `${ENV}-panel`,
  QUESTION: `${ENV}-question`,
  METRIC: `${ENV}-metric`,
};

const CHUNK_SIZE = 25; // No more than 25 because the SDK doesn't allow it

const client = new DynamoDBClient({});

const delay = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const teamMembers = [
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 1111,
    UIN: 11111111,
    EmailID: "joaquin.gimenez@tamu.edu",
    FName: "Joaquin",
    LName: "Gimenez",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 2222,
    UIN: 22222222,
    EmailID: "anshita.gupta@tamu.edu",
    FName: "Anshita",
    LName: "Gupta",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 3333,
    UIN: 33333333,
    EmailID: "anujakumthekar@tamu.edu",
    FName: "Anuja",
    LName: "Ajay Kumthekar",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 4444,
    UIN: 44444444,
    EmailID: "helencrawford@tamu.edu",
    FName: "Helen",
    LName: "Crawford",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 5555,
    EmailID: "aditya.naik@tamu.edu",
    FName: "Aditya",
    LName: "Naik",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 55555555,
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 6666,
    EmailID: "pawan.terdal@tamu.edu",
    FName: "Pawan",
    LName: "Terdal",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 66666666,
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 7777,
    EmailID: "hemanth@tamu.edu",
    FName: "Hemanth",
    LName: "Kalyana",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 77777777,
  },
  {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: 8888,
    EmailID: "davidgomilliontest@gmail.com",
    FName: "Test",
    LName: "Account",
    Role: "panelist",
    Section: "ISTM-622-601",
    UIN: 88888888,
  },
];

const createDynamoDBQuestionObject = (question) => {
  const date = new Date(Date.now()).toISOString();

  return {
    QuestionID: { S: question.QuestionID },
    DislikedBy: { L: [] }, // Should be an array of valid user IDs
    LikedBy: { L: [] }, // Should be an array of valid user IDs
    FlaggedBy: { L: [] }, // Should be an array of valid user IDs
    SimilarTo: { L: [] }, // Should be an array of valid questions IDs
    DislikeScore: { N: question.DislikeScore.toString() },
    FinalScore: { N: question.FinalScore.toString() },
    LikeScore: { N: question.LikeScore.toString() },
    PanelID: { S: question.PanelID },
    PresentationBonusScore: { N: question.PresentationBonusScore.toString() },
    QuestionText: { S: question.QuestionText },
    UserID: { S: question.UserID },
    VotingStageBonusScore: { N: question.VotingStageBonusScore.toString() },
    CreatedAt: { S: date },
  };
};

const createDynamoDBPanelObject = (panel) => {
  const date = new Date(Date.now()).toISOString();

  return {
    PanelID: { S: panel.PanelID },
    NumberOfQuestions: { N: panel.NumberOfQuestions.toString() },
    PanelDesc: { S: panel.PanelDesc },
    Panelist: { S: panel.Panelist },
    PanelName: { S: panel.PanelName },
    PanelPresentationDate: { S: panel.PanelPresentationDate },
    PanelStartDate: { S: panel.PanelStartDate },
    PanelVideoLink: { S: panel.PanelVideoLink },
    QuestionStageDeadline: { S: panel.QuestionStageDeadline },
    TagStageDeadline: { S: panel.TagStageDeadline },
    Visibility: { S: panel.Visibility },
    VoteStageDeadline: { S: panel.VoteStageDeadline },
    CreatedAt: { S: date },
  };
};
const createDynamoDBMetricObject = (metric) => {
  const date = new Date(Date.now()).toISOString();

  return {
    PanelID: { S: metric.PanelID },
    UserID: { S: metric.UserID },
    QuestionStageScore: { N: metric.QuestionStageScore.toString() },
    TagStageInTime: { S: metric.TagStageInTime },
    TagStageOutTime: { S: metric.TagStageOutTime },
    TagStageSD: { N: metric.TagStageSD.toString() },
    TagStageScore: { N: metric.TagStageScore.toString() },
    VoteStageInTime: { S: metric.VoteStageInTime },
    VoteStageOutTime: { S: metric.VoteStageOutTime },
    VoteStageSD: { N: metric.VoteStageSD.toString() },
    VoteStageScore: { N: metric.VoteStageScore.toString() },
    EnteredQuestionsTotalScore: {
      N: metric.EnteredQuestionsTotalScore.toString(),
    },
    FinalTotalScore: { N: metric.FinalTotalScore.toString() },
    CreatedAt: { S: date },
  };
};

const createDynamoDBUserObject = (user) => {
  const date = new Date(Date.now()).toISOString();

  return {
    UserID: { S: user.UserID },
    CanvasID: { N: user.CanvasID.toString() },
    UIN: { N: user.UIN.toString() },
    EmailID: { S: user.EmailID },
    FName: { S: user.FName },
    LName: { S: user.LName },
    Role: { S: user.Role },
    Section: { S: user.Section },
    CreatedAt: { S: date },
  };
};

const createRandomUser = ({ role = "student" }) => {
  return {
    UserID: `u-${faker.string.uuid()}`,
    CanvasID: faker.number.int({ min: 100, max: 500 }),
    EmailID: faker.internet.email(),
    FName: faker.person.firstName(),
    LName: faker.person.lastName(),
    Role: role,
    Section: "ISTM-622-601",
    UIN: faker.number.int({ min: 1000, max: 5000 }),
  };
};

const generateTeamUsers = () => {
  let newRecord;
  let newMembers = [];
  for (const member of teamMembers) {
    newRecord = { PutRequest: { Item: createDynamoDBUserObject(member) } };
    newMembers.push(newRecord);
  }
  return newMembers;
};

const generateUserWithRole = ({ role = "student" }) => {
  const ramdomStudent = createRandomUser({ role });
  const newRecord = {
    PutRequest: { Item: createDynamoDBUserObject(ramdomStudent) },
  };
  return newRecord;
};

const generateAdmins = ({ count = 2 }) => {
  let admins = [];
  let newAdmin;
  for (let i = 0; i < count; i++) {
    newAdmin = generateUserWithRole({ role: "admin" });
    admins.push(newAdmin);
  }
  return admins;
};

const generatePanelists = ({ count = 4 }) => {
  let panelists = [];
  let newPanelist;
  for (let i = 0; i < count; i++) {
    newPanelist = generateUserWithRole({ role: "panelist" });
    panelists.push(newPanelist);
  }
  return panelists;
};

const generateStudents = ({ count = 5 }) => {
  let students = [];
  let newStudent;
  for (let i = 0; i < count; i++) {
    newStudent = generateUserWithRole({ role: "student" });
    students.push(newStudent);
  }
  return students;
};

const createRandomPanel = () => {
  const randomNumber = faker.number.int({ min: 1, max: 100 });
  const visibility = randomNumber % 2 === 0 ? "public" : "internal";

  const startDate = faker.date.soon({ days: randomNumber });
  const questionsDeadline = faker.date.soon({
    days: 10,
    refDate: startDate,
  });

  const tagDeadline = faker.date.soon({
    days: 10,
    refDate: questionsDeadline,
  });
  const voteDeadline = faker.date.soon({
    days: 10,
    refDate: tagDeadline,
  });
  const presentationDate = faker.date.soon({
    days: 10,
    refDate: voteDeadline,
  });

  return {
    PanelID: `p-${faker.string.uuid()}`,
    NumberOfQuestions: faker.number.int({ min: 3, max: 10 }),
    PanelDesc: faker.lorem.paragraph(),
    Panelist: faker.person.fullName(),
    PanelName: `Panel ${faker.company.buzzAdjective()}`,
    PanelStartDate: startDate,
    QuestionStageDeadline: questionsDeadline,
    TagStageDeadline: tagDeadline,
    VoteStageDeadline: voteDeadline,
    PanelPresentationDate: presentationDate,
    PanelVideoLink: faker.image.urlLoremFlickr(),
    Visibility: visibility,
  };
};

const createRandomQuestion = (panelID, userID) => {
  const question = {
    QuestionID: `q-${faker.string.uuid()}`,
    PanelID: panelID,
    DislikeScore: faker.number.int({ min: 1, max: 100 }),
    FinalScore: faker.number.int({ min: 1, max: 100 }),
    LikeScore: faker.number.int({ min: 1, max: 100 }),
    PresentationBonusScore: faker.number.int({ min: 1, max: 100 }),
    VotingStageBonusScore: faker.number.int({ min: 1, max: 100 }),
    QuestionText: faker.lorem.paragraph(),
    UserID: userID,
    LikedBy: [userID], // Should be an array of multiple valid user IDs
    DislikedBy: [userID], // Should be an array of multiple valid user IDs
    FlaggedBy: [userID], // Should be an array of multiple valid user IDs
    SimilarTo: [],
  };
  return question;
};

const createRandomMetric = (panelID, userID) => {
  const metric = {
    PanelID: panelID,
    UserID: userID,
    QuestionStageScore: faker.number.int({ min: 1, max: 100 }),
    TagStageInTime: faker.date.soon(),
    TagStageOutTime: faker.date.soon(),
    TagStageSD: faker.number.int({ min: 1, max: 100 }), // Do we need to calculate the standar deviation HERE????
    TagStageScore: faker.number.int({ min: 1, max: 100 }),
    VoteStageInTime: faker.date.soon(),
    VoteStageOutTime: faker.date.soon(),
    VoteStageSD: faker.number.int({ min: 1, max: 100 }), // Do we need to calculate the standar deviation HERE????
    VoteStageScore: faker.number.int({ min: 1, max: 100 }),
    EnteredQuestionsTotalScore: faker.number.int({ min: 1, max: 100 }),
    FinalTotalScore: faker.number.int({ min: 1, max: 100 }),
  };
  return metric;
};

const generateMetrics = (panels, users) => {
  let panelID;
  let userID;
  let newMetrics = [];

  // Loop through each generated panel to create questions
  for (let panel of panels) {
    panelID = panel.PutRequest.Item.PanelID.S;
    for (let user of users) {
      userID = user.PutRequest.Item.UserID.S;
      const metric = createRandomMetric(panelID, userID);
      newMetrics.push({
        PutRequest: { Item: createDynamoDBMetricObject(metric) },
      });
    }
  }

  return newMetrics;
};

const generateQuestions = (panels, users, questionsByPanel = 20) => {
  let panelID;
  let userID;
  let randomUserIndex;
  let panelQuestions = [];

  // Loop through each generated panel to create questions
  const questions = panels.map((panel) => {
    panelID = panel.PutRequest.Item.PanelID.S;

    for (let i = 0; i < questionsByPanel; i++) {
      // Randomly select a user from the list of users
      randomUserIndex = faker.number.int({ min: 0, max: users.length - 1 });
      userID = users[randomUserIndex].PutRequest.Item.UserID.S;

      // Create a random question
      const question = createRandomQuestion(panelID, userID);

      // Add the question to the list of questions
      panelQuestions.push({
        PutRequest: { Item: createDynamoDBQuestionObject(question) },
      });
    }
    return true;
  });

  return panelQuestions;
};

const generatePanels = (panelCount = 5) => {
  const panels = [];
  let randomPanel;
  let newRecord;
  for (let i = 0; i < panelCount; i++) {
    randomPanel = createRandomPanel();
    newRecord = {
      PutRequest: { Item: createDynamoDBPanelObject(randomPanel) },
    };
    panels.push(newRecord);
  }
  return panels;
};

const generateUsers = () => {
  const allUsers = [];

  const teamMembers = generateTeamUsers();
  // Concat did not work, ugly but it works
  teamMembers.map((user) => {
    allUsers.push(user);
    return;
  });

  const students = generateStudents({ count: 70 });
  // Concat did not work, ugly but it works
  students.map((user) => {
    allUsers.push(user);
    return;
  });

  const panelists = generatePanelists({ count: 17 });
  // Concat did not work, ugly but it works
  panelists.map((user) => {
    allUsers.push(user);
    return;
  });

  const admins = generateAdmins({ count: 5 });
  // Concat did not work, ugly but it works
  admins.map((user) => {
    allUsers.push(user);
    return;
  });

  return allUsers;
};

const main = async () => {
  const users = generateUsers();
  const panels = generatePanels();
  const questions = generateQuestions(panels, users);
  const metrics = generateMetrics(panels, users);

  let batchItems = {};

  if (users.length > 0) {
    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      // Clean batch items
      batchItems = {};
      const chunk = users.slice(i, i + CHUNK_SIZE);
      batchItems[TABLE_NAME.USER] = chunk;
      const putUsers = new BatchWriteItemCommand({
        RequestItems: batchItems,
      });
      try {
        console.log(`USERS -- Inserting: ${i}`);
        await client.send(putUsers);
      } catch (error) {
        console.log("USERS -- Error:", error.message);
      }
      console.log(`USERS -- Waiting`);
      await delay(3000);
    }
  }
  if (panels.length > 0) {
    for (let i = 0; i < panels.length; i += CHUNK_SIZE) {
      // Clean batch items
      batchItems = {};
      const chunk = panels.slice(i, i + CHUNK_SIZE);
      batchItems[TABLE_NAME.PANEL] = chunk;
      const putPanels = new BatchWriteItemCommand({
        RequestItems: batchItems,
      });
      try {
        console.log(`PANELS -- Inserting: ${i}`);
        await client.send(putPanels);
      } catch (error) {
        console.log("PANELS -- Error:", error.message);
      }
      console.log(`PANELS -- Waiting`);
      await delay(3000);
    }
  }

  if (questions.length > 0 && panels.length > 0 && questions.length > 0) {
    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      // Clean batch items
      batchItems = {};
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      batchItems[TABLE_NAME.QUESTION] = chunk;
      const putQuestions = new BatchWriteItemCommand({
        RequestItems: batchItems,
      });
      try {
        console.log(`QUESTIONS -- Inserting: ${i}`);
        await client.send(putQuestions);
      } catch (error) {
        console.log("QUESTIONS -- Error:", error.message);
      }
      console.log(`QUESTIONS -- Waiting`);
      await delay(3000);
    }
  }

  if (metrics.length > 0) {
    for (let i = 0; i < metrics.length; i += CHUNK_SIZE) {
      // Clean batch items
      batchItems = {};
      const chunk = metrics.slice(i, i + CHUNK_SIZE);
      batchItems[TABLE_NAME.METRIC] = chunk;
      const putMetrics = new BatchWriteItemCommand({
        RequestItems: batchItems,
      });
      try {
        console.log(`METRICS -- Inserting: ${i}`);
        await client.send(putMetrics);
      } catch (error) {
        console.log("METRICS -- Error:", error.message);
      }
      console.log(`METRICS -- Waiting`);
      await delay(3000);
    }
  }
};

main();

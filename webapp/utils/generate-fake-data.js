import { faker } from "@faker-js/faker";

import {
  DynamoDBClient,
  ListTablesCommand,
  GetItemCommand,
  PutItemCommand,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const teamMembers = [
  {
    UserID: faker.string.uuid(),
    CanvasID: 1111,
    UIN: 11111111,
    EmailID: "joaquin.gimenez@tamu.edu",
    FName: "Joaquin",
    LName: "Gimenez",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 2222,
    UIN: 22222222,
    EmailID: "anshita.gupta@tamu.edu",
    FName: "Anshita",
    LName: "Gupta",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 3333,
    UIN: 33333333,
    EmailID: "anujakumthekar@tamu.edu",
    FName: "Anuja",
    LName: "Ajay Kumthekar",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 4444,
    UIN: 44444444,
    EmailID: "helencrawford@tamu.edu",
    FName: "Helen",
    LName: "Crawford",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 5555,
    EmailID: "aditya.naik@tamu.edu",
    FName: "Aditya",
    LName: "Naik",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 55555555,
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 6666,
    EmailID: "pawan.terdal@tamu.edu",
    FName: "Pawan",
    LName: "Terdal",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 66666666,
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 7777,
    EmailID: "hemanth@tamu.edu",
    FName: "Hemanth",
    LName: "Kalyana",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 77777777,
  },
];

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

const createRandomUser = () => {
  const randomNumber = faker.number.int(100);
  const role = randomNumber % 2 === 0 ? "student" : "admin";
  return {
    UserID: faker.string.uuid(),
    CanvasID: faker.number.int({ min: 100, max: 500 }),
    EmailID: faker.internet.email(),
    FName: faker.person.firstName(),
    LName: faker.person.lastName(),
    Role: role,
    Section: "ISTM-622-601",
    UIN: faker.number.int({ min: 1000, max: 5000 }),
  };
};

const generateUsers = (userCount = 3) => {
  const users = [];
  let newRecord;
  for (const member of teamMembers) {
    newRecord = { PutRequest: { Item: createDynamoDBUserObject(member) } };
    users.push(newRecord);
  }
  let randomUser;
  for (let i = 0; i < userCount; i++) {
    randomUser = createRandomUser();
    newRecord = { PutRequest: { Item: createDynamoDBUserObject(randomUser) } };
    users.push(newRecord);
  }
  return users;
};

const createDynamoDBPanelObject = (panel) => {
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
  };
};

const createRandomPanel = () => {
  const randomNumber = faker.number.int(100);
  const visibility = randomNumber % 2 === 0 ? "public" : "internal";

  return {
    PanelID: faker.string.uuid(),
    NumberOfQuestions: faker.number.int({ min: 3, max: 10 }),
    PanelDesc: faker.lorem.paragraph(),
    Panelist: faker.person.fullName(),
    PanelName: `Panel ${faker.company.buzzAdjective()}`,
    PanelPresentationDate: faker.date.anytime(),
    PanelStartDate: faker.date.anytime(),
    PanelVideoLink: faker.image.urlLoremFlickr(),
    QuestionStageDeadline: faker.date.anytime(),
    TagStageDeadline: faker.date.anytime(),
    Visibility: visibility,
    VoteStageDeadline: faker.date.anytime(),
  };
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

const createDynamoDBQuestionObject = (question) => {
  return {
    QuestionID: { S: question.QuestionID },
    PanelID: { S: question.PanelID },
    DislikeScore: { N: question.DislikeScore.toString() },
    FinalScore: { N: question.FinalScore.toString() },
    LikeScore: { N: question.LikeScore.toString() },
    NeutralScore: { N: question.NeutralScore.toString() },
    PresentationBonusScore: { N: question.PresentationBonusScore.toString() },
    QuestionText: { S: question.QuestionText },
    VotingStageBonusScore: { N: question.VotingStageBonusScore.toString() },
    UserID: { S: question.UserID },
    LikedBy: { SS: question.LikedBy }, // Should be an array of valid user IDs
    DislikedBy: { SS: question.DislikedBy }, // Should be an array of valid user IDs
  };
};

const createRandomQuestion = (panelID, userID) => {
  const question = {
    QuestionID: faker.string.uuid(),
    PanelID: panelID,
    DislikeScore: faker.number.int({ min: 1, max: 100 }),
    FinalScore: faker.number.int({ min: 1, max: 100 }),
    LikeScore: faker.number.int({ min: 1, max: 100 }),
    NeutralScore: faker.number.int({ min: 1, max: 100 }),
    PresentationBonusScore: faker.number.int({ min: 1, max: 100 }),
    VotingStageBonusScore: faker.number.int({ min: 1, max: 100 }),
    QuestionText: faker.lorem.paragraph(),
    UserID: userID,
    LikedBy: [userID], // Should be an array of valid user IDs
    DislikedBy: [userID], // Should be an array of valid user IDs
  };
  return question;
};

const generateQuestions = (panels, users, questionsByPanel = 5) => {
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

    return panelQuestions;
  });

  return questions;
};

const main = async () => {
  const users = generateUsers();
  const panels = generatePanels();
  const questions = generateQuestions(panels, users);

  let batchItems = {};

  if (users.length > 0) {
    batchItems["local-user"] = users;
  }
  if (panels.length > 0) {
    batchItems["local-panel"] = panels;
  }

  if (questions.length > 0 && panels.length > 0 && questions.length > 0) {
    batchItems["local-questions"] = questions;
  }

  console.log(JSON.stringify(batchItems, null, 2));
  const command = new BatchWriteItemCommand({
    RequestItems: batchItems,
  });

  const response = await client.send(command);

  return response;
};

main();

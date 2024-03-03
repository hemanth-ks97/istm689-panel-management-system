import { faker } from "@faker-js/faker";

import {
  DynamoDBClient,
  ListTablesCommand,
  GetItemCommand,
  PutItemCommand,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const createUser = (user) => {
  const date = new Date(Date.now()).toISOString();

  return {
    UserID: { S: user.UserID },
    CanvasID: { N: user.CanvasID.toString() },
    CreatedAt: { S: date },
    EmailID: { S: user.EmailID },
    FName: { S: user.FName },
    LName: { S: user.LName },
    Role: { S: user.Role },
    Section: { S: user.Section },
    UIN: { N: user.UIN.toString() },
  };
};

const createRandomUser = () => {
  return {
    UserID: faker.string.uuid(),
    CanvasID: faker.number.int({ min: 100, max: 500 }),
    EmailID: faker.internet.email(),
    FName: faker.person.firstName(),
    LName: faker.person.lastName(),
    Role: "student",
    Section: "ISTM-622-601",
    UIN: faker.number.int({ min: 1000, max: 5000 }),
  };
};

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

const generateUsers = (userCount = 3) => {
  const users = [];
  let newRecord;
  for (const member of teamMembers) {
    newRecord = { PutRequest: { Item: createUser(member) } };
    users.push(newRecord);
  }
  let randomUser;
  for (let i = 0; i < userCount; i++) {
    randomUser = createRandomUser();
    newRecord = { PutRequest: { Item: createUser(randomUser) } };
    users.push(newRecord);
  }
  return users;
};

const createRandomPanel = () => {
  return {
    PanelID: { S: faker.string.uuid() },
    NumberOfQuestions: { N: faker.number.int({ min: 3, max: 10 }).toString() },
    PanelDesc: { S: faker.lorem.paragraph() },
    Panelist: { S: faker.person.fullName() },
    PanelName: { S: `Panel ${faker.company.buzzAdjective()}` },
    PanelPresentationDate: { S: faker.date.anytime() },
    PanelStartDate: { S: faker.date.anytime() },
    PanelVideoLink: { S: faker.image.urlLoremFlickr() },
    QuestionStageDeadline: { S: faker.date.anytime() },
    TagStageDeadline: { S: faker.date.anytime() },
    Visibility: { S: "public" },
    VoteStageDeadline: { S: faker.date.anytime() },
  };
};

const generatePanels = (panelCount = 5) => {
  const panels = [];
  let randomPanel;
  for (let i = 0; i < panelCount; i++) {
    randomPanel = { PutRequest: { Item: createRandomPanel() } };
    panels.push(randomPanel);
  }
  return panels;
};
const generateQuestions = (panels, users) => {
  let panelID;
  let userID = users[0].PutRequest.Item.UserID.S.toString();
  const questions = panels.map((panel) => {
    panelID = panel.PutRequest.Item.PanelID.S;

    const panelQuestions = [];

    // For each panel, generate 5 questions
    for (let i = 0; i < 5; i++) {
      panelQuestions.push({
        PutRequest: {
          Item: {
            QuestionID: { S: faker.string.uuid() },
            PanelID: { S: panelID },
            DislikeScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            FinalScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            LikeScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            NeutralScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            PresentationBonusScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            QuestionText: {
              S: faker.lorem.paragraph(),
            },
            VotingStageBonusScore: {
              N: faker.number.int({ min: 1, max: 100 }).toString(),
            },
            UserID: { S: userID },
            LikedBy: { S: userID },
            DislikedBy: { S: userID },
          },
        },
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

  // if (users.length > 0) {
  //   batchItems["local-user"] = users;
  // }
  // if (panels.length > 0) {
  //   batchItems["local-panel"] = panels;
  // }

  if (questions.length > 0) {
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

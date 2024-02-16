import axios from "axios";

import { API_BASE_URL } from "../config";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

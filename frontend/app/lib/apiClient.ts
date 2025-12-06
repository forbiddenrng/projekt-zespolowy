import axios, {AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders, AxiosInstance} from "axios";

export class APIClient {
  private client: AxiosInstance;

  constructor(){
    this.client = axios.create({
      baseURL: `${process.env.GATEWAY_URL}/users`
    });
  }


  async getUser(accessToken: string, params: URLSearchParams){
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }

    const query: string = params.toString();

    try {
      const response = await this.client.get(`me?${query}`, config);
      return response;
    } catch (err){
      console.error(err);
      throw err;
    }
  }

  async getAllLanguages(accessToken: string){
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }

    try {
      const response = await this.client.get(`languages/all`, config);
      return response;
    } catch (err){
      console.error(err);
      throw err;
    }
  }


  async createProfile(accessToken: string, payload: any){
    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      } 
    }

    try {
      const response = await this.client.post("", payload, config);
      return response;
    } catch (err){
      console.error(err);
      throw err;
    }
  }

  async updateProfile(url: string, accessToken: string, payload: any){
    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      } 
    }

    try {
      const response = await this.client.put(`${url}`, payload, config);
      return response;
    } catch(err){
      console.log(err);
      throw err;
    }
  }

  
  // for updating personal info
  async updateUserInfo(accessToken: string, payload: any){
    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      } 
    }

    try {
      const response = await this.client.patch('me', payload, config);
      return response;
    } catch(err){
      console.log(err);
      throw err;
    }
  }
 
}
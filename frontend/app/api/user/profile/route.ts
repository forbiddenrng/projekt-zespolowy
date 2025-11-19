import { NextResponse } from "next/server";
// import { getAccessToken } from "@auth0/nextjs-auth0";
import {auth0} from "@/app/lib/auth0"


export const GET = auth0.withApiAuthRequired(async function handler() {
  try {

    const accessToken = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    })

    // console.log(accessToken)

    

    const apiRes = await fetch(`${process.env.API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`
      },
    });

    console.log(apiRes)

    // const data = await apiRes.json();

    return NextResponse.json({});
  } catch(err: any){
    return NextResponse.json({message: err.message}, {status: 500});
  }
})
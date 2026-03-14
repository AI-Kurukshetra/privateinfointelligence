import { NextResponse } from "next/server";

type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(status: number, error: ApiError) {
  return NextResponse.json({ error }, { status });
}

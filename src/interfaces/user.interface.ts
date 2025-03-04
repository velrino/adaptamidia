import { IApiUserResponse } from "@/backend/api/api.interface";

export const UserMock: IApiUserResponse = {
  token: {
    id: "67969dd5c9b3a4056973a43a",
    iat: 1737924285,
    exp: 1738529085,
    expires_in: "2025-02-02T17:44:45.000-03:00",
  },
  user: {
    _id: "67969dd5c9b3a4056973a43a",
    name: "Natiely Alves",
    email: "admin@xmpmedia.com",
    permissions: [],
    auth_type: "DEFAULT",
    otp: "INACTIVE",
    created_at: "2025-01-26T20:40:53.279Z",
    updated_at: "2025-01-26T20:40:53.279Z",
  },
};

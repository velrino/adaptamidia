import { HttpException, HttpStatus } from '@nestjs/common';
import {
  Client,
  GeocodeResponseData,
} from '@googlemaps/google-maps-services-js';
import { RESULT } from '../result.enum';

export class GoogleMapsService {
  static async getCoordinates(address: string): Promise<GeocodeResponseData> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new HttpException(
        RESULT.GOOGLE_MAPS_API_KEY_IS_NOT_CONFIGURED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const client = new Client();

    try {
      const response = await client.geocode({
        params: {
          address,
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new HttpException(
          RESULT.GOOGLE_MAPS_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      const location = response.data.results[0]?.geometry.location;

      if (!location) {
        throw new HttpException(
          RESULT.GOOGLE_MAPS_NO_COORDINATES_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      return response.data;
    } catch (error) {
      // Handle specific Google Maps API errors or rethrow
      throw new HttpException(
        error.response?.data?.error_message || error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

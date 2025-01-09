import { ConcertDTO } from '@/dtos/concert-dto'
import { VenueDTO } from '@/dtos/venue-dto'
import { venueDTOSerializedSchema } from '@/dtos/venue-dto/venue-dto.types'
import {
  getConcertListByVenueIdParamsSchema,
  getConcertListByVenueIdQueryStringSchema,
  getConcertListByVenueIdSuccessResponseSchema,
  getVenueByIdParamsSchema,
} from '@/routes/venue/venue.types'
import { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify'
import { z } from 'zod'

interface GetVenueByIdRoute extends RouteGenericInterface {
  Params: z.infer<typeof getVenueByIdParamsSchema>
  Reply: {
    200: z.infer<typeof venueDTOSerializedSchema>
    404: void
    500: void
  }
}

export const getVenueByIdHandler = async (
  req: FastifyRequest<GetVenueByIdRoute>,
  rep: FastifyReply<GetVenueByIdRoute>,
) => {
  try {
    const { id: venueId } = req.params
    const venue = await VenueDTO.findById(venueId)
    if (!venue) {
      return rep.status(404).send()
    }
    const venueSerialized = venue.serialize()
    return rep.status(200).send(venueSerialized)
  } catch (e) {
    return rep.status(500).send()
  }
}

interface GetConcertListByVenueIdRoute extends RouteGenericInterface {
  Querystring: z.infer<typeof getConcertListByVenueIdQueryStringSchema>
  Params: z.infer<typeof getConcertListByVenueIdParamsSchema>
  Reply: {
    200: z.infer<typeof getConcertListByVenueIdSuccessResponseSchema>
    500: void
  }
}

export const getConcertListByVenueIdHandler = async (
  req: FastifyRequest<GetConcertListByVenueIdRoute>,
  rep: FastifyReply<GetConcertListByVenueIdRoute>,
) => {
  try {
    const { venueId } = req.params
    const { offset, size } = req.query
    const dtos = await ConcertDTO.listByVenueId(venueId, {
      orderBy: 'latest',
      take: +size,
      skip: +offset,
    })
    return rep.status(200).send(dtos.map((dto) => dto.serialize()))
  } catch (e) {
    return rep.status(500).send()
  }
}
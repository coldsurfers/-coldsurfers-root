import { ArtistDTO } from '@/dtos/artist-dto'
import { ConcertDTO } from '@/dtos/concert-dto'
import {
  SubscribeArtistDTO,
  subscribedArtistDTOSerializedSchema,
  SubscribedArtistSerialized,
} from '@/dtos/subscribe-artist-dto'
import { subscribedConcertDTOSerializedListSchema, SubscribedConcertSerialized } from '@/dtos/subscribe-concert-dto'
import { SubscribeConcertDTO } from '@/dtos/subscribe-concert-dto/subscribe-concert-dto'
import { SubscribeVenueDTO, SubscribeVenueSerialized, subscribeVenueSerializedSchema } from '@/dtos/subscribe-venue-dto'
import { UserDTO } from '@/dtos/user-dto/user-dto'
import { VenueDTO } from '@/dtos/venue-dto'
import { ErrorResponse, errorResponseSchema } from '@/lib/error'
import {
  getSubscribeCommonParamsSchema,
  getSubscribedConcertListQueryStringSchema,
  subscribeArtistBodySchema,
  SubscribeArtistParams,
  SubscribeConcertParams,
  subscribeVenueBodySchema,
  SubscribeVenueParams,
  unsubscribeArtistBodySchema,
  unsubscribeVenueBodySchema,
} from '@/routes/subscribe/subscribe.types'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RouteGenericInterface } from 'fastify/types/route'
import { z } from 'zod'

interface GetSubscribedConcertListRoute extends RouteGenericInterface {
  Querystring: z.infer<typeof getSubscribedConcertListQueryStringSchema>
  Reply: {
    200: z.infer<typeof subscribedConcertDTOSerializedListSchema>
    401: z.infer<typeof errorResponseSchema>
    500: z.infer<typeof errorResponseSchema>
  }
}

export const getSubscribedConcertListHandler = async (
  req: FastifyRequest<GetSubscribedConcertListRoute>,
  rep: FastifyReply<GetSubscribedConcertListRoute>,
) => {
  try {
    const user = await UserDTO.findById(req.user.id)
    if (!user || !user.props.id) {
      return rep.status(401).send({ code: 'INVALID_USER', message: 'Unauthorized' })
    }

    const { offset, size } = req.query

    const subscribedConcerts = await SubscribeConcertDTO.list({
      userId: user.props.id,
      take: +size,
      skip: +offset,
    })

    return rep.status(200).send(subscribedConcerts.map((value) => value.serialize()))
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface GetConcertSubscribeRoute extends RouteGenericInterface {
  Params: z.infer<typeof getSubscribeCommonParamsSchema>
  Reply: {
    200: SubscribedConcertSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const getConcertSubscribeHandler = async (
  req: FastifyRequest<GetConcertSubscribeRoute>,
  rep: FastifyReply<GetConcertSubscribeRoute>,
) => {
  try {
    const { id: concertId } = req.params
    const subscribedConcert = await SubscribeConcertDTO.findByConcertIdUserId(concertId, req.user.id)
    if (!subscribedConcert) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_CONCERT_NOT_FOUND',
        message: 'subscribed concert not found',
      })
    }
    return rep.status(200).send(subscribedConcert.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface GetArtistSubscribeRoute extends RouteGenericInterface {
  Params: z.infer<typeof getSubscribeCommonParamsSchema>
  Reply: {
    200: z.infer<typeof subscribedArtistDTOSerializedSchema>
    401: z.infer<typeof errorResponseSchema>
    404: z.infer<typeof errorResponseSchema>
    500: z.infer<typeof errorResponseSchema>
  }
}

export const getArtistSubscribeHandler = async (
  req: FastifyRequest<GetArtistSubscribeRoute>,
  rep: FastifyReply<GetArtistSubscribeRoute>,
) => {
  try {
    const { id: artistId } = req.params
    const subscribedArtist = await SubscribeArtistDTO.findByArtistIdUserId(artistId, req.user.id)
    if (!subscribedArtist) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_ARTIST_NOT_FOUND',
        message: 'subscribed artist not found',
      })
    }
    return rep.status(200).send(subscribedArtist.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({
      code: 'UNKNOWN',
      message: 'internal server error',
    })
  }
}

interface GetVenueSubscribeRoute extends RouteGenericInterface {
  Params: z.infer<typeof getSubscribeCommonParamsSchema>
  Reply: {
    200: z.infer<typeof subscribeVenueSerializedSchema>
    401: z.infer<typeof errorResponseSchema>
    404: z.infer<typeof errorResponseSchema>
    500: z.infer<typeof errorResponseSchema>
  }
}

export const getVenueSubscribeHandler = async (
  req: FastifyRequest<GetVenueSubscribeRoute>,
  rep: FastifyReply<GetVenueSubscribeRoute>,
) => {
  try {
    const { id: venueId } = req.params
    const subscribedVenue = await SubscribeVenueDTO.findByVenueIdUserId(venueId, req.user.id)
    if (!subscribedVenue) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_VENUE_NOT_FOUND',
        message: 'subscribed venue not found',
      })
    }
    return rep.status(200).send(subscribedVenue.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({
      code: 'UNKNOWN',
      message: 'internal server error',
    })
  }
}

interface PostSubscribeConcertRoute extends RouteGenericInterface {
  Params: SubscribeConcertParams
  Reply: {
    200: SubscribedConcertSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const postSubscribeConcertHandler = async (
  req: FastifyRequest<PostSubscribeConcertRoute>,
  rep: FastifyReply<PostSubscribeConcertRoute>,
) => {
  try {
    const { id: concertId } = req.params

    const concert = await ConcertDTO.findById(concertId)
    if (!concert || !concert.props.id) {
      return rep.status(404).send({ code: 'CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const subscribedConcert = await SubscribeConcertDTO.findByConcertIdUserId(concertId, req.user.id)

    if (subscribedConcert) {
      return rep.status(200).send(subscribedConcert.serialize())
    }

    const dto = new SubscribeConcertDTO({
      concertId,
      userId: req.user.id,
    })

    const data = await dto.subscribeConcert()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeConcertRoute extends RouteGenericInterface {
  Params: SubscribeConcertParams
  Reply: {
    200: SubscribedConcertSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const deleteUnsubscribeConcertHandler = async (
  req: FastifyRequest<DeleteUnsubscribeConcertRoute>,
  rep: FastifyReply<DeleteUnsubscribeConcertRoute>,
) => {
  try {
    const { id: concertId } = req.params

    const concert = await ConcertDTO.findById(concertId)
    if (!concert || !concert.props.id) {
      return rep.status(404).send({ code: 'CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const subscribedConcert = await SubscribeConcertDTO.findByConcertIdUserId(concertId, req.user.id)

    if (!subscribedConcert) {
      return rep.status(404).send({ code: 'SUBSCRIBED_CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const data = await subscribedConcert.unsubscribeConcert()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface PostSubscribeArtistRoute extends RouteGenericInterface {
  Params: SubscribeArtistParams
  Body: z.infer<typeof subscribeArtistBodySchema>
  Reply: {
    200: SubscribedArtistSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const postSubscribeArtistHandler = async (
  req: FastifyRequest<PostSubscribeArtistRoute>,
  rep: FastifyReply<PostSubscribeArtistRoute>,
) => {
  try {
    const { id: artistId } = req.params

    const artist = await ArtistDTO.findById(artistId)
    if (!artist || !artist.id) {
      return rep.status(404).send({ code: 'ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const subscribedArtist = await SubscribeArtistDTO.findByArtistIdUserId(artistId, req.user.id)

    if (subscribedArtist) {
      return rep.status(200).send(subscribedArtist.serialize())
    }

    const dto = new SubscribeArtistDTO({
      artistId,
      userId: req.user.id,
    })

    const data = await dto.subscribeArtist()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeArtistRoute extends RouteGenericInterface {
  Params: SubscribeArtistParams
  Body: z.infer<typeof unsubscribeArtistBodySchema>
  Reply: {
    200: SubscribedArtistSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const deleteUnsubscribeArtistHandler = async (
  req: FastifyRequest<DeleteUnsubscribeArtistRoute>,
  rep: FastifyReply,
) => {
  try {
    const { id: artistId } = req.params

    const artist = await ArtistDTO.findById(artistId)
    if (!artist || !artist.id) {
      return rep.status(404).send({ code: 'ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const subscribedArtist = await SubscribeArtistDTO.findByArtistIdUserId(artistId, req.user.id)

    if (!subscribedArtist) {
      return rep.status(404).send({ code: 'SUBSCRIBED_ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const data = await subscribedArtist.unsubscribeArtist()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface PostSubscribeVenueRoute extends RouteGenericInterface {
  Params: SubscribeVenueParams
  Body: z.infer<typeof subscribeVenueBodySchema>
  Reply: {
    200: SubscribeVenueSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const postSubscribeVenueHandler = async (
  req: FastifyRequest<PostSubscribeVenueRoute>,
  rep: FastifyReply<PostSubscribeVenueRoute>,
) => {
  try {
    const { id: venueId } = req.params

    const venue = await VenueDTO.findById(venueId)
    if (!venue || !venue.id) {
      return rep.status(404).send({ code: 'VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const subscribedVenue = await SubscribeVenueDTO.findByVenueIdUserId(venueId, req.user.id)

    if (subscribedVenue) {
      return rep.status(200).send(subscribedVenue.serialize())
    }

    const dto = new SubscribeVenueDTO({
      venueId,
      userId: req.user.id,
    })

    const data = await dto.subscribeVenue()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeVenueRoute extends RouteGenericInterface {
  Params: SubscribeVenueParams
  Body: z.infer<typeof unsubscribeVenueBodySchema>
  Reply: {
    200: SubscribeVenueSerialized
    401: ErrorResponse
    404: ErrorResponse
    500: ErrorResponse
  }
}

export const deleteUnsubscribeVenueHandler = async (
  req: FastifyRequest<DeleteUnsubscribeVenueRoute>,
  rep: FastifyReply<DeleteUnsubscribeVenueRoute>,
) => {
  try {
    const { id: venueId } = req.params

    const venue = await VenueDTO.findById(venueId)
    if (!venue || !venue.id) {
      return rep.status(404).send({ code: 'VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const subscribedVenue = await SubscribeVenueDTO.findByVenueIdUserId(venueId, req.user.id)

    if (!subscribedVenue) {
      return rep.status(404).send({ code: 'SUBSCRIBED_VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const data = await subscribedVenue.unsubscribeVenue()

    return rep.status(200).send(data.serialize())
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}
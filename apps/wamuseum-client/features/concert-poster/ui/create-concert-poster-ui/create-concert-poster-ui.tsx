import useConcertQuery from '@/hooks/useConcertQuery'
import useCreateConcertPosterMutation from '@/hooks/useCreateConcertPosterMutation'
import { presign, uploadToPresignedURL } from '@/utils/fetcher'
import { getPosterS3Url } from '@/utils/get-poster-s3-url'
import pickFile from '@/utils/pickFile'
import { Button } from '@coldsurfers/ocean-road'
import { concertPosterQuery } from 'gql/queries'
import { useCallback, useMemo } from 'react'

export const CreateConcertPosterUI = ({ concertId }: { concertId: string }) => {
  const { data: concertData } = useConcertQuery({
    variables: {
      concertId,
    },
  })

  const [mutateCreateConcertPoster] = useCreateConcertPosterMutation()

  const concert = useMemo(() => {
    if (!concertData?.concert) return null
    switch (concertData.concert.__typename) {
      case 'HttpError':
        return null
      case 'Concert':
        return concertData.concert
      default:
        return null
    }
  }, [concertData])
  const onClickCreatePoster = useCallback(() => {
    if (!concert) return
    pickFile(async (e) => {
      const { target } = e
      if (!target) return
      const filename = new Date().toISOString()
      // @ts-expect-error
      const { files } = target
      const presignedData = await presign({
        filename,
        filetype: 'image/*',
        type: 'poster-thumbnails',
      })
      await uploadToPresignedURL({
        data: presignedData,
        file: files[0],
      })
      mutateCreateConcertPoster({
        variables: {
          input: {
            concertId: concert.id,
            imageURL: getPosterS3Url(filename),
          },
        },
        update: (cache, { data }) => {
          if (!concert) {
            return
          }
          if (data?.createConcertPoster.__typename !== 'Poster') {
            return
          }
          cache.writeQuery({
            query: concertPosterQuery,
            variables: {
              concertId: concert.id,
            },
            data: {
              concertPoster: {
                __typename: 'PosterList',
                list: [data.createConcertPoster],
              },
            },
          })
        },
      })
    })
  }, [concert, mutateCreateConcertPoster])

  return (
    <Button onClick={onClickCreatePoster} style={{ marginTop: 12 }}>
      포스터 등록하기
    </Button>
  )
}
import docker
import time

client = docker.from_env()


def start_challenge_container(docker_image: str, challenge_id: str, user_alias: str) -> dict:
    container = client.containers.run(
        docker_image,
        detach=True,
        remove=True,
        mem_limit="128m",
        cpu_period=100000,
        cpu_quota=50000,
        ports={"3000/tcp": None},  # bind to a random host port
        labels={"cyberquest": "1", "challenge_id": challenge_id, "user_alias": user_alias},
    )

    # Wait briefly for the port binding to be assigned
    time.sleep(1)
    container.reload()
    port = int(container.ports["3000/tcp"][0]["HostPort"])

    return {"container_id": container.id, "port": port, "status": "running"}


def stop_container(container_id: str):
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=5)
    except docker.errors.NotFound:
        pass
